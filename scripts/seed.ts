import { pool } from '../lib/db'
import { seed } from '../lib/seed'

seed()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(() => pool.end())
