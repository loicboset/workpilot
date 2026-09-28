# 0021. v0.1 data model

- Status: Accepted
- Date: 2026-09-28

## Decision

The v0.1 tables and columns are described in [data-model.md](../data-model.md): 11 synced tables (profiles, north_stars, milestones, todos, time_blocks, ideas, notes, journal_entries, review_templates, ticker_messages, reminders) and 3 server-only tables (ai_settings, prompts, push_subscriptions).

Every synced table has a client-generated UUID, `created_at`, `updated_at` and a soft-delete `deleted_at`.

## Why

- Client-generated IDs and soft deletes are what offline-first sync needs.
- Plural snake_case table names, one consistent "done" rule (`completed_at`), and "postpone = change the date" keep the model simple.
- Secrets (AI key) and device push data stay on the server.
