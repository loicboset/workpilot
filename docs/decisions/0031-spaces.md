# 0031. Spaces: separate worlds in one install

- Status: Accepted
- Date: 2026-09-29

## Context

One person often steers more than one part of their life, for example a job and a personal
life, each with its own direction. One North Star and one Today for both blurs them. Like
browser profiles (Chrome), they need to live side by side in one install, with one login, and
stay fully apart.

## Decision

**What a space is**

- A space is a separate world: its own North Star (required) and milestones (optional), todos,
  time blocks, reminders, ideas, notes, journal entries, review templates, ticker messages,
  colour palette and AI settings (provider, key, prompts). Nothing is shown or linked across
  spaces, and nothing moves between them.
- Shared by every space: the login, the profile (name, language, timezone, city), light or dark
  mode, and the devices that receive notifications.
- ADR 0001 still holds: one person per install. ADR 0013 now reads "one North Star per space".

**Data**

- A synced `spaces` table: `name`, `slug` (the name in URLs, unique), `palette` (moved from
  `profiles`), `archived_at`.
- Every per-space table gets a required `space_id` → spaces. Links between rows use two-column
  foreign keys, e.g. `(space_id, milestone_id)` → `milestones (space_id, id)`, so the database
  refuses a link across spaces (ADR 0022). A row never changes space.
- `ai_settings` has one row per space; `prompts` are keyed by space and key. A space created
  online starts with a copy of those of the space it was created from; otherwise it starts
  without AI, set up in its Settings.
- Every device syncs every space (ADR 0025 unchanged), so switching is instant and works offline.
- The data from before spaces goes into a first space, **Humetria**.

**Screens and URLs**

- `/` is the start page: the spaces as tiles (name, palette, North Star), archived ones greyed
  out. It is the only place to create, rename, archive and restore a space.
- Everything else lives under the space's slug: `/work`, `/work/today`, `/work/settings`… The
  slug comes from the name ("Côté pro" → `cote-pro`) and follows a rename. An unknown or
  archived slug leads to `/`. `onboarding` and `sign-in` can't be slugs; names are unique,
  archived spaces included.
- The space menu in the header, right of Capture, switches space and keeps the page
  (`/work/today` → `/personal/today`). Two tabs can show two spaces.
- Onboarding sets up the first space: you → the space (name, palette, and "you can add others
  later") → its North Star → milestones. A new space from `/` asks for its name and palette,
  then its North Star and milestones.
- A space's Settings: the profile (marked as shared), light or dark (shared), the space's
  palette and AI.
- Archiving deletes nothing: the space is greyed out on `/` and its reminders stop. The last
  active space can't be archived.
- Each device keeps a copy of every space's palette, so a page starts in its space's colours
  before the data is read (as it already does for light or dark).

**API**

- Per-space routes live under `/api/spaces/{space_id}/…`, e.g. `/api/spaces/{id}/todos` and
  `/api/spaces/{id}/ai/settings`. `/api/spaces` lists and changes the spaces. Auth, profile,
  push and sync stay where they are.

## Why

- **Apart, like browser profiles**, rather than one list with a filter: each space stays calm,
  and a combined view was not wanted.
- **A `space_id` column**, rather than a database or a schema per space: one migration path,
  one sync, one job runner. Rejected: a browser database per space (spaces not in use go stale
  offline, and each needs its own outbox); a PostgreSQL schema per space (migrations per
  schema, heavy for a small server); two installs (two logins, and their session cookies clash
  on one host).
- **Every space on every device**: offline-first means the space you switch to must already be
  there.
- **The slug in the URL**, rather than a "current space" kept on the device: links and tabs say
  which space they show. A rename changes the URL, the price of readable URLs.
- **Archive, not delete**: nothing is lost by mistake.
