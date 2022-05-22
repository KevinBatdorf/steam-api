import { copyFileSync } from 'fs'
import { join } from 'path'

// move db file
const oldDb = join(__dirname, '../prisma/games.db')
const newDb = join(__dirname, '../.next/server/pages/api/games.db')
copyFileSync(oldDb, newDb)
