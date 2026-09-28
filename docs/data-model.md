# Data model (v0.1)

Conventions:

- Table names are plural, lowercase snake_case (`time_blocks`). Link columns are singular (`milestone_id`).
- `?` = nullable. `→` = foreign key.
- Timestamps are stored in UTC (`timestamptz`). Dates without a time use `date`.
- Enums are stored as text with a check constraint (easy to extend with a migration).
- Database: PostgreSQL only (ADR 0024).

## Synced tables (browser ⇄ server)

Every synced table also has:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key. Generated on the device, so rows can be created offline. |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Last change; used to resolve sync conflicts. |
| `deleted_at` | timestamptz? | Soft delete: a deletion must reach every device. |
| `revision` | bigint | Sync position, set by a database trigger on every insert and update (ADR 0025). |

| Table | Columns |
|---|---|
| `profiles` | `first_name` text · `last_name` text? · `locale` text (en/fr/es) · `timezone` text · `city` text? |
| `north_stars` | `title` text · `description` text? · `target_date` date? |
| `milestones` | `north_star_id` → north_stars · `title` text · `description` text? · `target_date` date? · `position` int · `completed_at` timestamptz? |
| `todos` | `title` text · `notes` text? · `due_date` date? · `completed_at` timestamptz? · `milestone_id` → milestones? |
| `time_blocks` | `title` text · `start_at` timestamptz · `end_at` timestamptz (after `start_at`) · `completed_at` timestamptz? · `milestone_id` → milestones? |
| `ideas` | `text` text |
| `notes` | `title` text? · `content` text · `milestone_id` → milestones? |
| `journal_entries` | `entry_date` date · `kind` (free/daily/weekly/monthly) · `content` text · `review_template_id` → review_templates? |
| `review_templates` | `name` text · `kind` (daily/weekly/monthly) · `questions` json (list of strings) |
| `ticker_messages` | `kind` (insight/tip/guidance/nudge/quote) · `text` text |
| `reminders` | `text` text · `remind_at` timestamptz · `recurrence` text? (iCal RRULE) · `sent_at` timestamptz? · `todo_id` → todos? · `time_block_id` → time_blocks? |

Rules:

- Done = `completed_at` is set (todos, time blocks, milestones).
- Postpone = change the date (`due_date`, or `start_at`/`end_at`).
- A guided review copies the template's questions into `content` as headings.
- Built-in review templates are inserted as normal rows on first launch.
- The header ticker shows the latest `ticker_messages` (by `created_at`). They are AI-generated only.

## Server-only tables (never sent to the browser)

| Table | Columns |
|---|---|
| `ai_settings` | `id` int · `provider` enum? (`openai_compatible`, `anthropic`) · `base_url` text? · `model` text? · `api_key_encrypted` text? · `updated_at` |
| `prompts` | `key` text (primary key, e.g. `ticker`) · `body` text · `updated_at` |
| `push_subscriptions` | `id` uuid · `endpoint` text (unique) · `p256dh_key` text · `auth_key` text · `device_name` text? · `created_at` |
| `sync_state` | `id` int (always 1) · `revision` bigint: the last revision handed out |

- `reminders`: due when `remind_at <= now` and `sent_at` is empty or older than `remind_at`; `sent_at` is written by the server only ([ADR 0027](decisions/0027-background-jobs.md)).
- `ai_settings` has a single row ([ai-providers.md](ai-providers.md)). The API key is encrypted with a key derived from `WORKPILOT_SECRET_KEY` and is never returned by the API.
- `prompts` only stores prompts the user edited; defaults ship in `apps/api/app/ai/prompts/`.

## Device-only tables (Dexie, in the browser)

| Table | Purpose |
|---|---|
| `outbox` | Rows changed on the device that still have to reach the server: `table`, `id`, `change_id`. |
| `conflicts` | Local versions the server did not keep, saved so nothing is lost: `table`, `id`, `row`, `reason`, `saved_at`. |
| `meta` | Local app state, e.g. `sync.cursor`. |

## Relationships

```
north_stars 1 ── n milestones
milestones  1 ── n todos, time_blocks, notes        (optional link)
todos / time_blocks 1 ── n reminders                (optional link)
review_templates 1 ── n journal_entries             (optional link)
```
