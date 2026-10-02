import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { pool } from '../lib/db'
import { insertGames, request, resetDb } from './helpers'

type Game = { appid: number; name: string }

const search = async (term: string) => {
    const { status, body } = await request(
        `/api/games?search=${encodeURIComponent(term)}`,
    )
    expect(status).toBe(200)
    return body as Game[]
}

beforeAll(async () => {
    await resetDb()
    await insertGames([
        [10, 'Counter-Strike'],
        [730, 'Counter-Strike 2'],
        [70, 'Half-Life'],
        [220, 'Half-Life 2'],
        [34010, 'Alpha Protocol'],
        [400, 'Portal'],
        [1091500, 'Cyberpunk 2077'],
        ...Array.from({ length: 40 }, (_, i): [number, string] => [
            900000 + i,
            `Filler ${i}`,
        ]),
    ])
})

afterAll(() => pool.end())

describe('GET /api/games', () => {
    it('ranks a name that starts with the search first', async () => {
        const [first] = await search('cyberpunk')
        expect(first).toMatchObject({ appid: 1091500, name: 'Cyberpunk 2077' })
    })

    it('finds names that contain the search', async () => {
        const games = await search('strike')
        expect(games.map((game) => game.name)).toEqual([
            'Counter-Strike',
            'Counter-Strike 2',
        ])
    })

    it('finds misspelled names', async () => {
        const games = await search('cyberpnuk 2077')
        expect(games.map((game) => game.appid)).toContain(1091500)
    })

    it('looks up a game by appid', async () => {
        const [first] = await search('730')
        expect(first).toMatchObject({ appid: 730, name: 'Counter-Strike 2' })
    })

    it('matches one or two characters as a prefix only', async () => {
        const games = await search('Ha')
        expect(games.map((game) => game.name).sort()).toEqual([
            'Half-Life',
            'Half-Life 2',
        ])
    })

    it('returns each game once when several searches match it', async () => {
        const games = await search('Portal')
        expect(games.filter((game) => game.appid === 400)).toHaveLength(1)
    })

    it('returns an empty list when nothing matches', async () => {
        expect(await search('zzzzqqq')).toEqual([])
    })

    it('returns 30 random games without a search', async () => {
        const { body } = await request('/api/games')
        expect(body).toHaveLength(30)
    })

    it('returns an empty list for anything but GET', async () => {
        const { status, body } = await request('/api/games?search=portal', {
            method: 'POST',
        })
        expect(status).toBe(200)
        expect(body).toEqual([])
    })
})
