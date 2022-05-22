import { PrismaClient } from '@prisma/client'
import { join } from 'path'

declare global {
    // allow global `var` declarations
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined
}

const options =
    process.env.NODE_ENV === 'production'
        ? {
              datasources: {
                  db: {
                      url: `file:${join(__dirname, 'games.db')}`,
                  },
              },
          }
        : undefined

export const prisma = global.prisma || new PrismaClient(options)

if (process.env.NODE_ENV !== 'production') global.prisma = prisma
