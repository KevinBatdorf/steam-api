import { PrismaClient } from '@prisma/client'
import { fetcher } from '../lib/fetcher'
const prisma = new PrismaClient({
    log: ['info', 'warn', 'error'],
})
type Game = {
    appid: number
    name: string
}

const key = process.env.STEAM_KEY

const fire = async (lastId = 0) => {
    const url = new URL(
        `https://api.steampowered.com/IStoreService/GetAppList/v1?key=${key}&json=1&max_results=1000`,
    )
    if (lastId) {
        url.searchParams.append('last_appid', lastId.toString())
    }
    console.log(`Querying games with lastId: ${lastId}`)
    const res = await fetcher(url.toString())
    if (!res?.response) {
        console.log(res)
        throw new Error('No games returned')
    }
    const games = res.response.apps
    if (!Array.isArray(games) || games.length === 0) {
        console.log('No more games to fetch, exiting.')
        return
    }

    const theLastId = games.at(-1).appid
    console.log(`Fetched ${games.length} games`)
    console.log(`Found lastId: ${theLastId}`)

    await Promise.all(
        games.map((game) =>
            prisma.game.upsert({
                where: { appid: game.appid },
                update: { name: game.name },
                create: { appid: game.appid, name: game.name },
            }),
        ),
    )
    if (theLastId !== lastId) {
        await fire(theLastId)
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
