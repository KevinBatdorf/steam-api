Updated daily by the seed workflow. Dates are UTC.

- `games.csv.gz`: every app this API has seen (`appid`, `name`, `first_listed`, `last_listed`)
- `delisted.csv.gz`: apps Steam no longer lists, most recently delisted first (`appid`, `name`, `last_listed`)
- `delisted-today.csv.gz`: apps that were listed on the previous run and are missing now

A `last_listed` of 2024-02-03 means on or before that day, since dates weren't recorded earlier.
