import { writeFile, readFile } from 'fs'
import { join } from 'path'

// move db file
readFile(join(__dirname, 'games.db'), (err, data) => {
    if (err) throw err
    writeFile('games.db', data, (err) => {
        if (err) throw err
        console.log('db file moved')
    })
})
