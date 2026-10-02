import { defineConfig } from 'vitest/config'

const url =
    process.env.TEST_DATABASE_URL ??
    'postgres://postgres:postgres@localhost:5432/postgres'

// The tests empty the Game table, so they must never reach a real database
const { hostname } = new URL(url)
if (!['localhost', '127.0.0.1'].includes(hostname)) {
    throw new Error(`Refusing to run tests against ${hostname}`)
}

export default defineConfig({
    test: {
        env: { DATABASE_URL: url },
        fileParallelism: false,
    },
})
