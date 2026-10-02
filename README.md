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

## Run your own

1. Create a Postgres database and copy its connection string.
2. Create the table:
    ```
    DATABASE_URL=postgres://... npm run db:setup
    ```
3. Get a Steam Web API key at https://steamcommunity.com/dev/apikey, then load the game list:
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
