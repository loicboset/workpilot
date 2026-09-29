# REST API (v0.1)

Interactive docs: `/api/docs` when the server runs. Conventions: [ADR 0023](decisions/0023-api-conventions.md).

## Conventions in short

- Everything of a space lives under `/api/spaces/{space_id}` ([ADR 0031](decisions/0031-spaces.md)):
  `/api/spaces/{space_id}/todos`, `…/north-star`, `…/ai/settings`. Rows answer with their
  `space_id`; a row of another space is a `404`, a link to one a `422`. Auth, profile, push and
  sync stay at the root.

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
| Profile (one, shared by every space) | `GET /api/profile` (404 before onboarding) · `PUT /api/profile` | |
| Spaces | `GET /api/spaces` (oldest first) · `POST /api/spaces` (`slug` made from `name` when not given: "Côté pro" → `cote-pro`; `copy_ai_from`: a space whose AI settings and prompts it starts with) · `GET`, `PATCH /api/spaces/{space_id}` (a new `name` without `slug` gives a new slug; `archived_at` archives, `null` restores). No `DELETE`: spaces are archived. `409` for a name already taken, whatever its case and accents; `422` for a name the app uses (`api`, `onboarding`, `sign-in`) or without letters or digits | `archived` |
| North Star (one per space) | `GET …/north-star` · `PUT …/north-star` | |
| Milestones | `…/milestones` | `north_star_id`, `completed` |
| Todos | `…/todos` | `due_from`, `due_to`, `completed`, `milestone_id` |
| Time blocks | `…/time-blocks` | `start_from`, `start_to`, `completed`, `milestone_id` |
| Reminders | `…/reminders` | `remind_from`, `remind_to`, `sent` (sent for its current time) |
| Ideas | `…/ideas` (newest first) | |
| Notes | `…/notes` (last edited first) | `milestone_id` |
| Journal entries | `…/journal-entries` (newest first) | `entry_from`, `entry_to`, `kind` |
| Review templates | `…/review-templates` | `kind` |
| Ticker messages | `GET …/ticker-messages` (newest first) · `POST …/ticker-messages/refresh` (asks the AI for new ones when the space's are over 6 hours old; `409 ai_not_configured` without AI) | `limit` (1–50, default 10) |
| Sync | `GET /api/sync/pull?since=&limit=` · `POST /api/sync/push` (see below) | |
| AI settings (server only, per space) | `GET …/ai/settings` · `PATCH …/ai/settings` (`provider`: `openai_compatible` or `anthropic`; `api_key` write-only, `null` removes it) | |
| AI models (server only, per space) | `GET …/ai/models`: model ids from the configured provider (also a connection test) · `POST …/ai/models/try` (`provider`, `base_url`, optional `api_key`, else the stored one): the same for settings not yet saved | |
| Prompts (server only, per space) | `GET …/ai/prompts` · `GET`, `PUT`, `DELETE …/ai/prompts/{key}` (`DELETE` = reset to default) | |
| Push (server only) | `GET /api/push/public-key` (the browser's `applicationServerKey`) · `POST /api/push/subscriptions` (same endpoint again = update) · `DELETE /api/push/subscriptions?endpoint=…` | |

`…` = `/api/spaces/{space_id}`. "All collection routes" = the 5 routes listed in the conventions above.

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

Spaces sync first. A row of a space carries its `space_id` and never changes space (`rejected`: "a row never changes space"). A row without one, from a device older than spaces, keeps the space it has, or goes to the first space when it is new. A new `spaces` row may carry `copy_ai_from`: the server then copies that space's AI settings and prompts.

## Reminders ([ADR 0027](decisions/0027-background-jobs.md))

A job checks every minute and sends each due reminder to every subscribed device, as a Web Push
message the service worker turns into a notification:

```json
{"type": "reminder", "id": "…", "text": "Call the editor", "space": "Personal", "url": "/personal/today"}
```

A reminder is due when `remind_at` has passed and it hasn't been sent for that time. Moving it
later sends it again. `recurrence` is an iCal RRULE without `COUNT`, e.g. `FREQ=WEEKLY;BYDAY=FR`.
Reminders are sent only when `WORKPILOT_PUSH_CONTACT` is set. An archived space's reminders are
passed over: not sent, and a repeating one moves on to its next time.

## Not built yet

- Showing reminders in the web app's service worker, and subscribing from the app.
- Seeding the built-in review templates.
