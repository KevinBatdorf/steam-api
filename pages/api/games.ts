import Fuse from 'fuse.js'
import { NextApiRequest, NextApiResponse } from 'next'
import { Game } from '@prisma/client'
import { prisma } from '../../lib/prisma'

const games: Game[] = []
const searchCache = new Map<string, Game[]>()

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const search = req.query?.search?.toString()
    if (req.method !== 'GET') {
        return res.status(200).json([])
    }

    if (searchCache.has(search)) {
        return res.status(200).json(searchCache.get(search))
    }

    if (!games.length) {
        // sqlite in prisma can't do a fuzzy search, so just
        // keep these in memory: https://github.com/prisma/prisma/issues/9414
        const allGames = await prisma.game.findMany()
        allGames.forEach((g) => games.push(g))
    }

    let results: Game[] = []
    if (search) {
        const fuse = new Fuse(games, { keys: ['name'] })
        results = fuse
            .search(search)
            .slice(0, 30)
            .map((result) => result.item)
        if (results?.length) {
            searchCache.set(search, results)
        }
    }

    // If no results, just return 30 random games
    if (!results.length) {
        const max = Math.floor(Math.random() * games.length) - 31
        const randomStart = Math.max(0, max)
        results = games.slice(randomStart, randomStart + 30)
    }

    return res.status(200).json(results)
}
