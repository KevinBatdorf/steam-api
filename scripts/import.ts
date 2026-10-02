import { Readable } from 'stream'
import { pool } from '../lib/db'
import { importGames } from '../lib/export'

const DUMP_URL =
    'https://github.com/KevinBatdorf/steam-api/releases/download/data/games.csv.gz'

const run = async () => {
    const res = await fetch(DUMP_URL)
    if (!res.ok || !res.body) throw new Error(`${res.status} ${res.statusText}`)
    const added = await importGames(
        Readable.fromWeb(res.body as import('stream/web').ReadableStream),
    )
    console.log(`Imported ${added} games`)
}

run()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => pool.end())
