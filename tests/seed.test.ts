import {
    afterAll,
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'
import { pool } from '../lib/db'
import { seed } from '../lib/seed'
import { resetDb } from './helpers'

type App = { appid: number; name: string }

const LONG_AGO = new Date('2020-01-01T00:00:00Z')

const page = (apps: App[], { more = false } = {}) =>
    new Response(
        JSON.stringify({
            response: {
                apps,
                have_more_results: more,
                last_appid: apps[apps.length - 1]?.appid,
            },
        }),
    )

const stubSteam = (...responses: Response[]) => {
    const fetch = vi.fn()
    for (const response of responses) fetch.mockResolvedValueOnce(response)
    vi.stubGlobal('fetch', fetch)
    return fetch
}

const games = async () =>
    (
        await pool.query<App & { updatedAt: Date }>(
            'SELECT appid, name, "updatedAt" FROM "Game" ORDER BY appid',
        )
    ).rows

const backdate = () =>
    pool.query('UPDATE "Game" SET "updatedAt" = $1', [LONG_AGO])

beforeEach(async () => {
    await resetDb()
    vi.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

afterAll(() => pool.end())

describe('seed', () => {
    it('pages through the game list until Steam says there are no more', async () => {
        const fetch = stubSteam(
            page([{ appid: 10, name: 'Counter-Strike' }], { more: true }),
            page([{ appid: 20, name: 'Team Fortress Classic' }]),
            page([]),
        )

        await seed()

        const nextPage = new URL(fetch.mock.calls[1][0])
        expect(nextPage.searchParams.get('last_appid')).toBe('10')
        expect(nextPage.searchParams.get('max_results')).toBe('50000')
        expect(nextPage.searchParams.get('include_games')).toBe('true')
        expect((await games()).map((game) => game.name)).toEqual([
            'Counter-Strike',
            'Team Fortress Classic',
        ])
    })

    it(
        'retries when Steam answers with an HTML error page',
        { timeout: 10000 },
        async () => {
            stubSteam(
                new Response('<html>Error</html>'),
                page([{ appid: 10, name: 'Counter-Strike' }]),
                page([]),
            )

            await seed()

            expect(await games()).toHaveLength(1)
        },
    )

    it('stamps every game Steam still lists and renames changed ones', async () => {
        stubSteam(
            page([
                { appid: 10, name: 'Counter-Strike' },
                { appid: 20, name: 'Team Fortress Classic' },
            ]),
            page([]),
        )
        await seed()
        await backdate()

        stubSteam(
            page([
                { appid: 10, name: 'Counter-Strike 1.6' },
                { appid: 20, name: 'Team Fortress Classic' },
            ]),
            page([]),
        )
        await seed()

        const [renamed, unchanged] = await games()
        expect(renamed.name).toBe('Counter-Strike 1.6')
        expect(renamed.updatedAt.getTime()).toBeGreaterThan(LONG_AGO.getTime())
        expect(unchanged.updatedAt.getTime()).toBeGreaterThan(
            LONG_AGO.getTime(),
        )
    })

    it('keeps games Steam stopped listing with their last listed date', async () => {
        stubSteam(
            page([
                { appid: 10, name: 'Counter-Strike' },
                { appid: 20, name: 'Team Fortress Classic' },
            ]),
            page([]),
        )
        await seed()
        await backdate()

        stubSteam(page([{ appid: 10, name: 'Counter-Strike' }]), page([]))
        await seed()

        const [, delisted] = await games()
        expect(delisted).toMatchObject({ appid: 20, updatedAt: LONG_AGO })
    })

    it('stamps other app types Steam lists without adding them', async () => {
        await pool.query(
            `INSERT INTO "Game" (appid, name, "updatedAt") VALUES (30, 'Old Soundtrack', $1)`,
            [LONG_AGO],
        )
        const fetch = stubSteam(
            page([{ appid: 10, name: 'Counter-Strike' }]),
            page([
                { appid: 30, name: 'Old Soundtrack' },
                { appid: 40, name: 'New Soundtrack' },
            ]),
        )

        await seed()

        const otherTypes = new URL(fetch.mock.calls[1][0])
        expect(otherTypes.searchParams.get('include_games')).toBe('false')
        expect(otherTypes.searchParams.get('include_dlc')).toBe('true')
        const rows = await games()
        expect(rows.map((game) => game.appid)).toEqual([10, 30])
        expect(rows[1].updatedAt.getTime()).toBeGreaterThan(LONG_AGO.getTime())
    })
})
