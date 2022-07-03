import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

type Game = {
    appid: number
    name: string
}

const searchCache = new Map<string, Game[]>()

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const search = req.query?.search?.toString()
    if (req.method !== 'GET') {
        return res.status(200).json([])
    }

    if (search && searchCache.has(search)) {
        return res.status(200).json(searchCache.get(search))
    }

    let results: Game[] = []

    // If a number is coming in, search the appid
    if (Number.isInteger(Number(search))) {
        const game = await prisma.game.findUnique({
            where: { appid: Number(search) },
        })
        // add to results if it exists
        if (game) results.push(game)
    }

    if ((search?.length ?? 0) > 2) {
        if (!search) return
        const games = await prisma.$queryRaw`
        (
            SELECT appid, name, 1 as score
            FROM public."Game"
            WHERE name ILIKE ${search} || '%'
        )
        UNION ALL
        (
            SELECT appid, name, 0.99 as score
            FROM public."Game"
            WHERE name ILIKE '%' || ${search} || '%'
        )
        UNION ALL
        (
            SELECT appid, name, similarity(name, ${search}) as score
            FROM public."Game"
            WHERE name % ${search}
        )
        order by score desc, name
        limit 100;
        `
        if (Array.isArray(games)) results.push(...games)
    } else if (search?.length) {
        // Searching 1 or 2 chars do startswith type search
        const games = await prisma.game.findMany({
            where: { name: { startsWith: search } },
        })
        if (Array.isArray(games)) results.push(...games)
    }

    // If no results, just return 30 random games
    if (results.length === 0 && !search?.length) {
        results = await prisma.$queryRawUnsafe(
            `SELECT * FROM "Game" ORDER BY RANDOM() LIMIT 30;`,
        )
    }

    // filter out any duplicates that may have been returned
    results = results.filter(
        (item, index, self) =>
            self.findIndex((t) => t.appid === item.appid) === index,
    )

    // set cache
    if (search) searchCache.set(search, results)
    return res.status(200).json(results)
}
