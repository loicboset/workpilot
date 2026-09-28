# REST API (v0.1)

Interactive docs: `/api/docs` when the server runs. Conventions: [ADR 0023](decisions/0023-api-conventions.md).

## Conventions in short

- JSON fields in `snake_case`; URLs in `kebab-case` and plural (`/api/time-blocks`).
- Every route except `/api/health` and `/api/auth/login` needs a signed-in session (cookie).
- Collections: `GET` (list), `POST` (create, `201`), `GET /{id}`, `PATCH /{id}` (partial update), `DELETE /{id}` (soft delete, `204`).
- `PATCH`: only the fields sent change; `null` clears an optional field. Done = set `completed_at`; postpone = change the date.
- Lists return a plain array, without soft-deleted rows unless `include_deleted=true`.
- Timestamps must include a timezone; responses are always UTC (`...Z`).
- Unknown fields in a request body are rejected (`422`).
- Errors: `{"detail": ...}`. `401` not signed in · `404` not found (or soft-deleted) · `409` duplicate · `422` invalid input or link to a missing row · `429` too many failed logins. AI routes: `409 ai_not_configured`, `502`/`504` with an `ai_…` code ([ai-providers.md](ai-providers.md#errors)).

## Endpoints

| Resource | Routes | List filters |
|---|---|---|
| Health | `GET /api/health` | |
| Auth | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | |
| Profile (one) | `GET /api/profile` (404 before onboarding) · `PUT /api/profile` | |
| North Star (one) | `GET /api/north-star` · `PUT /api/north-star` | |
| Milestones | `/api/milestones` | `north_star_id`, `completed` |
| Todos | `/api/todos` | `due_from`, `due_to`, `completed`, `milestone_id` |
| Time blocks | `/api/time-blocks` | `start_from`, `start_to`, `completed`, `milestone_id` |
| Reminders | `/api/reminders` | `remind_from`, `remind_to`, `sent` (sent for its current time) |
| Ideas | `/api/ideas` (newest first) | |
| Notes | `/api/notes` (last edited first) | `milestone_id` |
| Journal entries | `/api/journal-entries` (newest first) | `entry_from`, `entry_to`, `kind` |
| Review templates | `/api/review-templates` | `kind` |
| Ticker messages | `GET /api/ticker-messages` (read only, newest first) | `limit` (1–50, default 10) |
| Sync | `GET /api/sync/pull?since=&limit=` · `POST /api/sync/push` (see below) | |
| AI settings (server only) | `GET /api/ai/settings` · `PATCH /api/ai/settings` (`provider`: `openai_compatible` or `anthropic`; `api_key` write-only, `null` removes it) | |
| AI models (server only) | `GET /api/ai/models`: model ids from the configured provider (also a connection test) | |
| Prompts (server only) | `GET /api/ai/prompts` · `GET`, `PUT`, `DELETE /api/ai/prompts/{key}` (`DELETE` = reset to default) | |
| Push (server only) | `GET /api/push/public-key` (the browser's `applicationServerKey`) · `POST /api/push/subscriptions` (same endpoint again = update) · `DELETE /api/push/subscriptions?endpoint=…` | |

"All collection routes" = the 5 routes listed in the conventions above.

## Sync ([ADR 0025](decisions/0025-offline-sync.md))

`GET /api/sync/pull?since=0&limit=500`

```json
{"changes": [{"table": "todos", "row": {"id": "…", "title": "…", "updated_at": "…"}}], "cursor": 42, "has_more": false}
```

Rows use the same shape as the REST API, soft-deleted rows included. Send `cursor` back as `since`; pull again while `has_more` is true.

`POST /api/sync/push` (up to 500 changes)

```json
{"changes": [{"table": "todos", "row": {"id": "…", "title": "…", "created_at": "…", "updated_at": "…", "deleted_at": null}}]}
```

Answer: `{"applied": [ids], "skipped": [ids], "rejected": [{"table", "id", "reason"}]}`. Most recent `updated_at` wins; `skipped` means the server already had a newer version. `ticker_messages` are read only; server-owned fields (`revision`, `sent_at`) are ignored.

## Reminders ([ADR 0027](decisions/0027-background-jobs.md))

A job checks every minute and sends each due reminder to every subscribed device, as a Web Push
message the service worker turns into a notification:

```json
{"type": "reminder", "id": "…", "text": "Call the editor"}
```

A reminder is due when `remind_at` has passed and it hasn't been sent for that time. Moving it
later sends it again. `recurrence` is an iCal RRULE without `COUNT`, e.g. `FREQ=WEEKLY;BYDAY=FR`.
Reminders are sent only when `WORKPILOT_PUSH_CONTACT` is set.

## Not built yet

- Ticker generation (the AI provider interface is built: [ADR 0026](decisions/0026-ai-provider-interface.md)).
- Showing reminders in the web app's service worker, and subscribing from the app.
- Seeding the built-in review templates.
