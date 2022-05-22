import { copyFileSync, readdir } from 'fs'
import { join } from 'path'

// move db file
const oldDb = join(__dirname, '../prisma/games.db')
readdir(__dirname, (err, files) => {
    files.forEach((file) => {
        console.log(file)
    })
})
// copyFileSync(oldDb, newDb)
