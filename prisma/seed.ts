import { PrismaClient } from '@prisma/client'
import { fetcher } from '../lib/fetcher'
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
})
type Game = {
    appid: number
    name: string
}

const fire = async () => {
    const games = await fetcher(
        'https://api.steampowered.com/ISteamApps/GetAppList/v2?json=1',
    )
    if (!games.applist.apps) {
        throw new Error('No games returned')
    }

    // It doesn't look like prisma has upsertMany
    await usingChunks(games.applist.apps, async (games: Game[]) => {
        for (const game of games) {
            await prisma.game.upsert({
                where: { appid: game.appid },
                update: { name: game.name },
                create: { appid: game.appid, name: game.name },
            })
        }
    })
}

fire()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

const usingChunks = async (items: Game[], callback: Function) => {
    const chunkSize = Number(process.env.CHUNK_SIZE) || 1000
    const writeDelay = Number(process.env.WRITE_DELAY) || 100
    let temporary
    for (let i = 0; i < items.length; i += chunkSize) {
        temporary = items.slice(i, i + chunkSize)
        callback(temporary)
        await new Promise((resolve) => setTimeout(resolve, writeDelay))
    }
}
