import { pool } from '../lib/db'

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

const fetchPage = async (lastAppid: number): Promise<AppListPage> => {
    const url = new URL(
        'https://api.steampowered.com/IStoreService/GetAppList/v1/',
    )
    url.searchParams.set('key', process.env.STEAM_KEY ?? '')
    url.searchParams.set('max_results', String(PAGE_SIZE))
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

const save = async (apps: App[]) => {
    const { rowCount } = await pool.query(
        `INSERT INTO "Game" (appid, name)
        SELECT * FROM unnest($1::int[], $2::text[])
        ON CONFLICT (appid) DO UPDATE
            SET name = EXCLUDED.name, "updatedAt" = CURRENT_TIMESTAMP
            WHERE "Game".name IS DISTINCT FROM EXCLUDED.name`,
        [apps.map((app) => app.appid), apps.map((app) => app.name)],
    )
    return rowCount ?? 0
}

const seed = async () => {
    let lastAppid = 0
    for (;;) {
        const page = await fetchPage(lastAppid)
        const apps = page.apps ?? []
        const changed = apps.length ? await save(apps) : 0
        console.log(
            `Fetched ${apps.length} apps after appid ${lastAppid}, ${changed} new or renamed`,
        )
        if (!page.have_more_results || !page.last_appid) return
        lastAppid = page.last_appid
    }
}

seed()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => pool.end())
