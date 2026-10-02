import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '../../lib/db'

type Game = {
    appid: number
    name: string
}

const query = async (text: string, values?: unknown[]) =>
    (await pool.query<Game>(text, values)).rows

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const search = req.query?.search?.toString()
    if (req.method !== 'GET') {
        return res.status(200).json([])
    }

    let results: Game[] = []

    // If a number is coming in, search the appid
    if (Number.isInteger(Number(search))) {
        results.push(
            ...(await query('SELECT * FROM "Game" WHERE appid = $1', [
                Number(search),
            ])),
        )
    }

    if (search && search.length > 2) {
        const games = await query(
            `
            (
                SELECT appid, name, 1 as score
                FROM public."Game"
                WHERE name ILIKE $1 || '%'
            )
            UNION ALL
            (
                SELECT appid, name, 0.99 as score
                FROM public."Game"
                WHERE name ILIKE '%' || $1 || '%'
            )
            UNION ALL
            (
                SELECT appid, name, similarity(name, $1) as score
                FROM public."Game"
                WHERE name % $1
            )
            order by score desc, name
            limit 100;
            `,
            [search],
        )
        results.push(...games)
    } else if (search?.length) {
        // Searching 1 or 2 chars do startswith type search
        results.push(
            ...(await query(
                `SELECT * FROM "Game" WHERE name ILIKE $1 || '%' LIMIT 100`,
                [search],
            )),
        )
    }

    // If no results, just return 30 random games
    if (results.length === 0 && !search?.length) {
        results = await query('SELECT * FROM "Game" ORDER BY RANDOM() LIMIT 30')
    }

    // filter out any duplicates that may have been returned
    results = results.filter(
        (item, index, self) =>
            self.findIndex((t) => t.appid === item.appid) === index,
    )

    return res.status(200).json(results)
}
