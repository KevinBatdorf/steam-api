import { Pool } from 'pg'

declare global {
    // eslint-disable-next-line no-var
    var pool: Pool | undefined
}

export const pool =
    global.pool || new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') global.pool = pool
