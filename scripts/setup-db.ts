import { readFileSync } from 'fs'
import { join } from 'path'
import { pool } from '../lib/db'

pool.query(readFileSync(join(__dirname, '../db/schema.sql'), 'utf8'))
    .then(() => console.log('Database ready'))
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => pool.end())
