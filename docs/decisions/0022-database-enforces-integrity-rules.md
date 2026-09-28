# 0022. The database enforces integrity rules

- Status: Accepted
- Date: 2026-09-28

## Decision

Routes don't pre-check integrity rules (duplicate id, link to a missing row, check constraints). The database enforces them; a violation raises `IntegrityError`, answered once for the whole API by `app/errors.py`:

- duplicate (unique / primary key) → `409 Conflict`
- any other broken rule (e.g. unknown `milestone_id`) → `422 Unprocessable Content`
- database details are never included in the response

Create endpoints keep accepting an optional client-generated `id`.

## Why

- A "select, then insert" check is not atomic: two requests can pass the check at the same time. Only the database constraint guarantees the rule (see Django ticket #12579).
- One handler instead of checks copied into every route.
- Status codes follow RFC 9110: 409 = conflicts with the current state, 422 = semantically invalid content.
- Offline-first tools commonly upload queued device writes through the same per-resource REST endpoints, with the device's UUID (e.g. PowerSync's `uploadData` pattern), so dropping `id` from create would close that option before the sync decision.

Trade-off: linking to a soft-deleted milestone is no longer refused; the UI ignores such links.
