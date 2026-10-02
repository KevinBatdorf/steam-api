import { readFileSync } from 'fs'
import { join } from 'path'
import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '../lib/db'
import handler from '../pages/api/games'

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
    const url = new URL(path, 'http://localhost')
    const response = { status: 0, body: undefined as unknown }
    const res = {
        status: (code: number) => {
            response.status = code
            return res
        },
        json: (body: unknown) => {
            response.body = JSON.parse(JSON.stringify(body))
            return res
        },
    }
    await handler(
        {
            method,
            query: Object.fromEntries(url.searchParams),
        } as NextApiRequest,
        res as unknown as NextApiResponse,
    )
    return response
}
