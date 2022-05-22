import type { NextRequest } from 'next/server'

const game = new Map()

const fetcher = async (appId: string) => {
    const response = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${appId}`,
    )
    return await response.json()
}

export async function middleware(req: NextRequest) {
    const appId = req.nextUrl.searchParams.get('appId')
    if (!appId) return new Response('', { status: 400 })

    if (game.has(appId)) {
        return new Response(JSON.stringify(game.get(appId)), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        })
    }
    let data = await fetcher(appId)
    // if success is false, try again (seems to fail sometimes, but not often)
    if (!data?.[appId]?.success) {
        data = await fetcher(appId)
    }

    if (data?.[appId]?.success) {
        game.set(appId, data?.[appId]?.data)
        setTimeout(() => game.delete(appId), 5 * 60 * 1000) // 5 minutes
    }

    const response = data?.[appId]?.data ?? { error: { message: 'Not found' } }
    return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    })
}
