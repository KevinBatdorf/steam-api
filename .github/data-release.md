Updated daily by the seed workflow. Dates are UTC.

- `games.csv.gz`: every app this API has seen (`appid`, `name`, `first_listed`, `last_listed`)
- `delisted.csv.gz`: apps Steam no longer lists, most recently delisted first (`appid`, `name`, `last_listed`)
- `delisted-today.csv.gz`: apps that were listed on the previous run and are missing now

A `last_listed` of 2024-02-03 means on or before that day, since dates weren't recorded earlier.

The delisted files leave out about 75,000 apps last seen on 2025-11-12, mostly demos, playtests and soundtracks. That's when this API moved to Steam's current app list, which doesn't include those kinds of apps, so whether they were delisted is unknown. They're still in `games.csv.gz`.
