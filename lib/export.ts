import { createWriteStream } from 'fs'
import { join } from 'path'
import { Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { createGunzip, createGzip } from 'zlib'
import { from as copyFrom, to as copyTo } from 'pg-copy-streams'
import { pool } from './db'

// A run takes about a minute, so an hour-old stamp means the app was missed.
// Apps last seen 2025-11-12 left our view when the seed changed Steam lists.
const DELISTED = `
    SELECT appid, name, "updatedAt" AS last_listed FROM "Game"
    WHERE "updatedAt" < (SELECT max("updatedAt") FROM "Game") - interval '1 hour'
        AND "updatedAt"::date <> '2025-11-12'`

const EXPORTS = {
    'games.csv.gz': `SELECT appid, name, "createdAt" AS first_listed, "updatedAt" AS last_listed FROM "Game" ORDER BY appid`,
    'delisted.csv.gz': `${DELISTED} ORDER BY last_listed DESC, appid`,
    'delisted-today.csv.gz': `
        WITH delisted AS (${DELISTED})
        SELECT * FROM delisted
        WHERE last_listed >= (SELECT max(last_listed) FROM delisted) - interval '1 hour'
        ORDER BY appid`,
}

export const writeExports = async (dir: string) => {
    const client = await pool.connect()
    try {
        for (const [file, query] of Object.entries(EXPORTS)) {
            await pipeline(
                client.query(
                    copyTo(
                        `COPY (${query}) TO STDOUT WITH (FORMAT csv, HEADER true)`,
                    ),
                ),
                createGzip(),
                createWriteStream(join(dir, file)),
            )
        }
    } finally {
        client.release()
    }
}

export const importGames = async (source: Readable) => {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        await client.query(
            `CREATE TEMP TABLE import (appid int, name text, first_listed timestamp(3), last_listed timestamp(3)) ON COMMIT DROP`,
        )
        await pipeline(
            source,
            createGunzip(),
            client.query(
                copyFrom(
                    'COPY import FROM STDIN WITH (FORMAT csv, HEADER true)',
                ),
            ),
        )
        const { rowCount } = await client.query(
            `INSERT INTO "Game" (appid, name, "createdAt", "updatedAt")
            SELECT appid, name, first_listed, last_listed FROM import
            ON CONFLICT (appid) DO NOTHING`,
        )
        await client.query('COMMIT')
        return rowCount ?? 0
    } catch (error) {
        await client.query('ROLLBACK')
        throw error
    } finally {
        client.release()
    }
}
