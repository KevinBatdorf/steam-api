import type { NextRequest } from 'next/server'
import Fuse from 'fuse.js'

const gameData: GameSimple[] = []
const cache = new Map<string, GameSimple[]>()

export async function middleware(req: NextRequest) {
    const search = req.nextUrl.searchParams.get('search') ?? '*'

    if (!gameData.length) {
        const response = await fetch(
            'https://api.steampowered.com/ISteamApps/GetAppList/v2?json=1',
        )
        const data: GamesResponse = await response.json()
        data?.applist?.apps
            .filter((game) => game.name?.length)
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach((game) => gameData.push(game))
        setTimeout(() => {
            gameData.length = 0
        }, 24 * 60 * 60 * 1000) // 24 hours
    }

    if (cache.has(search)) {
        return new Response(JSON.stringify(cache.get(search)), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }

    const fuse = new Fuse(gameData, {
        keys: ['name'],
    })
    const results = fuse
        .search(search)
        .slice(0, 50)
        .map((result) => result.item)

    cache.set(search, results)
    setTimeout(() => cache.delete(search), 3 * 60 * 1000) // 3 minutes

    return new Response(JSON.stringify(results), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}

type GameSimple = {
    appid: number
    name: string
}
type GamesResponse = {
    applist: {
        apps: GameSimple[]
    }
}
