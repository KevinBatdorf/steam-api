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

## Vercel

Deploy to Vercel by pressing the button below

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKevinBatdorf%2Fsteam-api)
