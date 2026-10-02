import { mkdirSync } from 'fs'
import { pool } from '../lib/db'
import { writeExports } from '../lib/export'

mkdirSync('export', { recursive: true })

writeExports('export')
    .then(() => console.log('Wrote export/'))
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => pool.end())
