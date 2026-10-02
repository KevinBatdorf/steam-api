import { Pool, defaults, types } from 'pg'

// Columns hold UTC without a zone; pg would otherwise use the machine's local time
defaults.parseInputDatesAsUTC = true
types.setTypeParser(
    types.builtins.TIMESTAMP,
    (value) => new Date(`${value.replace(' ', 'T')}Z`),
)

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
