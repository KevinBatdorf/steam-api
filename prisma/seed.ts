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
    console.log(`Fetched ${games.applist.apps.length} games`)

    // It doesn't look like prisma has upsertMany
    await usingChunks(games.applist.apps, async (games: Game[]) => {
        await Promise.all(
            games.map((game) =>
                prisma.game.upsert({
                    where: { appid: game.appid },
                    update: { name: game.name },
                    create: { appid: game.appid, name: game.name },
                }),
            ),
        )
    })
    // Query to check if the games were inserted
    console.log(`There are ${await prisma.game.count()} games in the database`)
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
    const chunkSize = Number(process.env.CHUNK_SIZE) || 3000
    const writeDelay = Number(process.env.WRITE_DELAY) || 100
    let temporary
    for (let i = 0; i < items.length; i += chunkSize) {
        temporary = items.slice(i, i + chunkSize)
        console.log(
            `Processing batch ${Math.floor(i / chunkSize) + 1} of ${
                Math.floor(items.length / chunkSize) + 1
            }`,
        )
        callback(temporary)
        await new Promise((resolve) => setTimeout(resolve, writeDelay))
    }
}
