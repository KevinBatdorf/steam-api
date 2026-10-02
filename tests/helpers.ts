import { readFileSync } from 'fs'
import { join } from 'path'
import app from '../app'
import { pool } from '../lib/db'

export const resetDb = async () => {
    await pool.query(readFileSync(join(__dirname, '../db/schema.sql'), 'utf8'))
    await pool.query('TRUNCATE "Game"')
}

export const insertGames = (games: [number, string][]) =>
    pool.query(
        'INSERT INTO "Game" (appid, name) SELECT * FROM unnest($1::int[], $2::text[])',
        [games.map(([appid]) => appid), games.map(([, name]) => name)],
    )

export const request = async (path: string, { method = 'GET' } = {}) => {
    const res = await app.request(path, { method })
    return { status: res.status, body: (await res.json()) as unknown }
}
