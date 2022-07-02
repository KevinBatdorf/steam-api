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
    if (search) {
        results = await prisma.game.findMany({
            where: { name: { search } },
        })
        results = await prisma.$queryRaw`
            SELECT distinct appid, name, similarity(name, ${search}) as score
            FROM public."Game"
            WHERE name % ${search}
            order by score desc
            limit 30;
        `
        searchCache.set(search, results)
    }

    // If no results, just return 30 random games
    if (!results.length) {
        results = await prisma.$queryRawUnsafe(
            `SELECT * FROM "Game" ORDER BY RANDOM() LIMIT 30;`,
        )
    }

    return res.status(200).json(results)
}
