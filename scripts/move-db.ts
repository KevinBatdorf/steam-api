import { copyFileSync } from 'fs'
import { join } from 'path'

// move db file
copyFileSync(join(__dirname, '../prisma/games.db'), '.')
