import { existsSync } from 'fs'
import Fuse from 'fuse.js'
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

type Game = {
    appid: number
    name: string
}

// Get gamedata from local json file if it exists
let games: Game[] =
    process.env.NODE_ENV === 'production' && existsSync('./_games.json')
        ? require('./_games.json')
        : []
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
        // This also won't run in production as we convert it to a JSON file
        // to use serverless functions in Vercel
        const allGames = await prisma.game.findMany()
        allGames.forEach((g: Game) => games.push(g))
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
