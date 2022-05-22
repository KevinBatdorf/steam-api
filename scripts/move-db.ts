import { copyFile } from 'fs'
import { join } from 'path'

// move db file
copyFile(join(__dirname, '../prisma/games.db'), '.', (err) => {
    if (err) throw err
    console.log('db file moved')
})
