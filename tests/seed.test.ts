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
    it('pages through the app list until Steam says there are no more', async () => {
        const fetch = stubSteam(
            page([{ appid: 10, name: 'Counter-Strike' }], { more: true }),
            page([{ appid: 20, name: 'Team Fortress Classic' }]),
        )

        await seed()

        expect(fetch).toHaveBeenCalledTimes(2)
        const nextPage = new URL(fetch.mock.calls[1][0])
        expect(nextPage.searchParams.get('last_appid')).toBe('10')
        expect(nextPage.searchParams.get('max_results')).toBe('50000')
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
            )

            await seed()

            expect(await games()).toHaveLength(1)
        },
    )

    it('only rewrites apps whose name changed', async () => {
        stubSteam(
            page([
                { appid: 10, name: 'Counter-Strike' },
                { appid: 20, name: 'Team Fortress Classic' },
            ]),
        )
        await seed()
        const before = await games()

        stubSteam(
            page([
                { appid: 10, name: 'Counter-Strike 1.6' },
                { appid: 20, name: 'Team Fortress Classic' },
            ]),
        )
        await seed()
        const [renamed, unchanged] = await games()

        expect(renamed.name).toBe('Counter-Strike 1.6')
        expect(renamed.updatedAt.getTime()).toBeGreaterThan(
            before[0].updatedAt.getTime(),
        )
        expect(unchanged.updatedAt).toEqual(before[1].updatedAt)
    })
})
