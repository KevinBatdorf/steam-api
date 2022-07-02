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
    const gamesList: Game[] = games.applist.apps

    // Update in chunks to avoid heap overflow
    const chunks = gamesList.reduce((acc, game, index) => {
        const chunkIndex = Math.floor(index / 200)
        if (!acc?.[chunkIndex]) {
            acc[chunkIndex] = []
        }
        acc[chunkIndex].push(game)
        return acc
    }, [] as Game[][])

    let index = 1
    for (const chunk of chunks) {
        console.log(
            `Inserting ${chunk.length * index} games of ${gamesList.length}`,
            `(${gamesList.length - chunk.length * index} remaining)`,
        )
        await Promise.all(
            chunk.map((game) => {
                if (!game.name || game.appid < 10) {
                    return Promise.resolve()
                }
                const { appid, name } = game
                return prisma.game.upsert({
                    where: { appid },
                    update: { name },
                    create: { appid, name },
                })
            }),
        )
        index++
    }
}

fire()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
