# Local database

- `db.ts`: the Dexie (IndexedDB) database. The UI reads and writes here first, so the app works offline.
  Besides the synced tables it holds the `outbox` (rows waiting to reach the server), `conflicts`
  (local versions the server did not keep) and `meta` (e.g. the sync cursor).
- `types.ts`: the row types, in the same shape as the API.
- `tables.ts`: the list of synced tables, same names as on the server.

Sync lives in `src/sync` (ADR 0025). Screens never use `db` directly: they go through the
repositories in `src/data`.
