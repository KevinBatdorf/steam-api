# Steam API Search

TODO:
It seems the API game data endpoint is blocking Vercel IPs or something. The response is always empty when deployed, but is fine locally. Oddly enough, the all games endpoint works fine.
Another option is to seed an sqlite db in a GH action to use instead. Seeding once a day seems reasonable. And keep the basic edge function caching to keep the requests fast.

## Search and data

Get all games by search term:
```
/api/games?search=cyperpunk2077
```

Get game data by Steam appId (get it from the above request)
```
/api/game?appId=1091500
```

## Vercel

Deploy to Vercel by pressing the button below

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FKevinBatdorf%2Fsteam-api)
