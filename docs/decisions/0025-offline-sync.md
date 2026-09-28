# 0025. Offline sync

- Status: Accepted
- Date: 2026-09-28

## Context

WorkPilot is offline-first: each device (laptop, phone) keeps a full copy of the user's data in
IndexedDB (via Dexie) and must work without a connection. One user, a few devices, small data.

## Decision

Our own small sync, no sync library or extra service. The design is close to Linear's sync
engine and follows the proven points of RxDB's replication protocol and Google's
offline-first guide.

**Server**

- Every synced table has a `revision` (bigint). A PostgreSQL trigger sets it on every insert
  and update, whatever the source (sync, REST, AI jobs), from one counter row
  (`sync_state`). Updating that row inside each write transaction serialises writers, so
  revisions become visible in order and a pull can never skip a change.
- `GET /api/sync/pull?since=<cursor>&limit=500`: rows of every synced table with a revision
  above the cursor, oldest first, soft-deleted rows included. Returns the next `cursor` and
  `has_more`.
- `POST /api/sync/push` (up to 500 changes): full rows from the device. Applied in dependency
  order; each change succeeds or fails on its own. **Most recent edit wins**, by `updated_at`;
  a device clock in the future is brought back to the server's time. The response lists the
  ids `applied`, `skipped` (the server had a newer version) and `rejected` (with a reason).
  Server-owned fields (`revision`, `sent_at`) are ignored. `ticker_messages` are read only.

**Device** (`apps/web/src`)

- Screens read only from Dexie, through repositories (`src/data`). Writes are "lazy writes":
  saved to Dexie and queued in the `outbox`, then synced.
- One sync round = push the outbox, then pull until caught up. A pulled row never overwrites
  a row that still has a local edit waiting.
- A version the server did not keep (skipped or rejected) is saved in the local `conflicts`
  table, so nothing is lost silently.
- Sync runs at start, when back online, when the app is shown again, 1 s after a local edit
  and every 30 s; one tab at a time (Web Locks API). Network errors retry after 1 s, 2 s,
  4 s… up to 5 minutes. A 401 stops sync until the next login; the outbox is kept.
- Server-only data (AI settings, prompts, push subscriptions) is written online through REST.

## Why

- Hosted engines were ruled out: Dexie Cloud's server is proprietary; PowerSync and
  ElectricSQL need an extra service and logical replication; Replicache is archived.
- RxDB would work, but replaces how we use Dexie. Our version is a few hundred lines we own,
  with endpoint shapes close to RxDB's in case we switch later.
- Research: docs in the project (`research-sync.md`).

## Later

- Server-sent "something changed" events instead of polling every 30 s.
- Field-level merging (like Actual Budget) if row-level conflicts ever become a problem.
- A screen to review saved conflicts.
