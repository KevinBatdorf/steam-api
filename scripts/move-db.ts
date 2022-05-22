import { copyFileSync, readdir } from 'fs'
import { join } from 'path'

// move db file
const oldDb = join(__dirname, '../prisma/games.db')
console.log({ oldDb })
readdir(join(__dirname, '../prisma'), (err, files) => {
    files.forEach((file) => {
        console.log(file)
    })
})
// copyFileSync(oldDb, newDb)
