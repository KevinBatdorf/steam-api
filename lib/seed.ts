import { pool } from './db'

type App = {
    appid: number
    name: string
}

type AppListPage = {
    apps?: App[]
    have_more_results?: boolean
    last_appid?: number
}

const PAGE_SIZE = 50000
const ATTEMPTS = 5

const GAMES = { include_games: true }
const OTHER_TYPES = {
    include_games: false,
    include_software: true,
    include_dlc: true,
    include_videos: true,
    include_hardware: true,
}

const fetchPage = async (
    types: Record<string, boolean>,
    lastAppid: number,
): Promise<AppListPage> => {
    const url = new URL(
        'https://api.steampowered.com/IStoreService/GetAppList/v1/',
    )
    url.searchParams.set('key', process.env.STEAM_KEY ?? '')
    url.searchParams.set('max_results', String(PAGE_SIZE))
    for (const [param, value] of Object.entries(types)) {
        url.searchParams.set(param, String(value))
    }
    if (lastAppid) url.searchParams.set('last_appid', String(lastAppid))

    // Steam sometimes answers mid-run with an HTML error page instead of JSON
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetch(url)
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
            const body = await res.json()
            if (!body?.response) throw new Error('No response in body')
            return body.response
        } catch (error) {
            if (attempt === ATTEMPTS) throw error
            const delay = 2 ** attempt * 1000
            console.log(
                `Attempt ${attempt} failed (${error}), retrying in ${
                    delay / 1000
                }s`,
            )
            await new Promise((resolve) => setTimeout(resolve, delay))
        }
    }
}

const eachPage = async (
    types: Record<string, boolean>,
    handle: (apps: App[]) => Promise<unknown>,
) => {
    let lastAppid = 0
    for (;;) {
        const page = await fetchPage(types, lastAppid)
        const apps = page.apps ?? []
        if (apps.length) await handle(apps)
        console.log(`Fetched ${apps.length} apps after appid ${lastAppid}`)
        if (!page.have_more_results || !page.last_appid) return
        lastAppid = page.last_appid
    }
}

// updatedAt is when Steam last listed the app, so it dates delisted ones
const saveGames = (apps: App[]) =>
    pool.query(
        `INSERT INTO "Game" (appid, name)
        SELECT * FROM unnest($1::int[], $2::text[])
        ON CONFLICT (appid) DO UPDATE
            SET name = EXCLUDED.name, "updatedAt" = CURRENT_TIMESTAMP`,
        [apps.map((app) => app.appid), apps.map((app) => app.name)],
    )

const markListed = (apps: App[]) =>
    pool.query(
        'UPDATE "Game" SET "updatedAt" = CURRENT_TIMESTAMP WHERE appid = ANY($1::int[])',
        [apps.map((app) => app.appid)],
    )

const countGames = async () =>
    Number((await pool.query('SELECT count(*) FROM "Game"')).rows[0].count)

export const seed = async () => {
    const before = await countGames()
    await eachPage(GAMES, saveGames)
    await eachPage(OTHER_TYPES, markListed)
    console.log(`${(await countGames()) - before} new games`)
}
