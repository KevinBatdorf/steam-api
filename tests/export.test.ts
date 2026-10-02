import { createReadStream, mkdtempSync, readFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { gunzipSync } from 'zlib'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { pool } from '../lib/db'
import { importGames, writeExports } from '../lib/export'
import { resetDb } from './helpers'

const NOW = new Date('2026-10-02T16:00:30Z')
const LAST_RUN = new Date('2026-10-01T16:00:30Z')
const LONG_AGO = new Date('2024-02-03T12:17:37Z')
const LIST_SWITCH = new Date('2025-11-12T16:05:19Z')

const rows = () =>
    pool
        .query(
            'SELECT appid, name, "createdAt", "updatedAt" FROM "Game" ORDER BY appid',
        )
        .then((result) => result.rows)

const appids = (dir: string, file: string) =>
    gunzipSync(readFileSync(join(dir, file)))
        .toString()
        .trim()
        .split('\n')
        .slice(1)
        .map((line) => Number(line.split(',')[0]))

const exportToTemp = async () => {
    const dir = mkdtempSync(join(tmpdir(), 'steam-api-'))
    await writeExports(dir)
    return dir
}

beforeEach(async () => {
    await resetDb()
    await pool.query(
        `INSERT INTO "Game" (appid, name, "createdAt", "updatedAt") VALUES
            (10, 'Counter-Strike', $3, $1),
            (20, 'Team Fortress Classic', $3, $2),
            (30, 'Spec Ops: The Line', $3, $3),
            (40, 'Half-Life, "Source"', $3, $1),
            (50, 'Portal Demo', $3, $4)`,
        [NOW, LAST_RUN, LONG_AGO, LIST_SWITCH],
    )
})

afterAll(() => pool.end())

describe('writeExports', () => {
    it('writes every game', async () => {
        const dir = await exportToTemp()
        expect(appids(dir, 'games.csv.gz')).toEqual([10, 20, 30, 40, 50])
    })

    it('lists games missing from the latest run as delisted, newest first', async () => {
        const dir = await exportToTemp()
        expect(appids(dir, 'delisted.csv.gz')).toEqual([20, 30])
    })

    it('leaves out apps last seen when the seed switched app lists', async () => {
        await pool.query(
            `UPDATE "Game" SET "updatedAt" = $1 WHERE appid = 20`,
            [LIST_SWITCH],
        )
        const dir = await exportToTemp()
        expect(appids(dir, 'delisted.csv.gz')).toEqual([30])
        expect(appids(dir, 'delisted-today.csv.gz')).toEqual([30])
    })

    it('lists games last seen on the run before as delisted today', async () => {
        const dir = await exportToTemp()
        expect(appids(dir, 'delisted-today.csv.gz')).toEqual([20])
    })
})

describe('importGames', () => {
    it('loads a games export into an empty database', async () => {
        const before = await rows()
        const dir = await exportToTemp()
        await resetDb()

        await importGames(createReadStream(join(dir, 'games.csv.gz')))

        expect(await rows()).toEqual(before)
    })

    it('keeps games that are already in the database', async () => {
        const dir = await exportToTemp()
        await pool.query(
            `UPDATE "Game" SET name = 'Counter-Strike 2' WHERE appid = 10`,
        )

        await importGames(createReadStream(join(dir, 'games.csv.gz')))

        const [first] = await rows()
        expect(first.name).toBe('Counter-Strike 2')
    })
})
