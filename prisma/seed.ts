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
    for (const game of gamesList) {
        if (!game.name || game.appid < 10) continue
        const { appid, name } = game
        await prisma.game.upsert({
            where: { appid },
            update: { name },
            create: { appid, name },
        })
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
