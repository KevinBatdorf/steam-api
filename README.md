# Steam API Search

## Search game appids

Get all games by search term ([See it](https://steam-search.vercel.app/api/games?search=cyperpunk2077))
```
/api/games?search=cyperpunk2077
```

Get a random 30 games ([See it](https://steam-search.vercel.app/api/games))
```
/api/games
```
## Game data
Note: To get data about a game, send a get request using the appid returned above to the following. This endpoint is rate limited though and abusing it may get you banned:

```
https://store.steampowered.com/api/appdetails?appids=${appid}
```

## Download the list

The seed workflow publishes the whole list every day to the [`data` release](https://github.com/KevinBatdorf/steam-api/releases/tag/data):

- [`games.csv.gz`](https://github.com/KevinBatdorf/steam-api/releases/download/data/games.csv.gz): every app this API has seen, with when Steam first and last listed it
- [`delisted.csv.gz`](https://github.com/KevinBatdorf/steam-api/releases/download/data/delisted.csv.gz): apps Steam no longer lists
- [`delisted-today.csv.gz`](https://github.com/KevinBatdorf/steam-api/releases/download/data/delisted-today.csv.gz): apps that disappeared since the previous day

Steam's own app list drops delisted apps; this list keeps them.

## Run your own

1. Create a Postgres database and copy its connection string.
2. Create the table and load the full list, including delisted apps:
    ```
    DATABASE_URL=postgres://... npm run db:setup
    DATABASE_URL=postgres://... npm run db:import
    ```
3. Get a Steam Web API key at https://steamcommunity.com/dev/apikey, then add anything new:
    ```
    DATABASE_URL=postgres://... STEAM_KEY=... npm run seed
    ```
4. Deploy to Vercel with the button below, setting `DATABASE_URL`.
5. To refresh the list daily, add `DATABASE_URL` and `STEAM_KEY` as GitHub Actions secrets on your repo. `.github/workflows/seed-database.yml` runs the seed every day.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKevinBatdorf%2Fsteam-api&env=DATABASE_URL)

## Tests

The tests need a local Postgres. They empty the `Game` table, so they refuse to run against anything but localhost.

```
docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
npm test
```

Set `TEST_DATABASE_URL` to use a different local database.
