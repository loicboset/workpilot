# WorkPilot

A calm, self-hosted, offline-first workspace that connects your **North Star** to your daily work, your learning and your ideas, with an optional AI pilot (cloud API or local model).

> Status: **pre-alpha**. v0.1 ("Core loop") is being built. See [docs/roadmap.md](docs/roadmap.md).

## Principles

- **Never stressful**: no red alerts, no guilt counters.
- **Never heavy**: runs on a small free server, one Docker image.
- **Never locked in**: your data is yours and exportable; AI is optional.

## Stack

| Layer | Tech |
|---|---|
| Web app | React, TypeScript, Vite, Tailwind CSS, Zustand, TanStack Query, React Hook Form, Dexie (offline storage), i18next, PWA |
| API | FastAPI (Python), SQLAlchemy, Alembic |
| Database | PostgreSQL |
| Packaging | One Docker image (the API serves the built web app) + Postgres |

## Repository layout

```
apps/web     React PWA (offline-first)
apps/api     FastAPI backend (auth, sync, AI, domain)
docs/        roadmap, decisions (ADRs), methodologies
```

## Getting started (development)

Prerequisites: Node 22+, pnpm (`corepack enable`), Python 3.13 + [uv](https://docs.astral.sh/uv/), Docker (for Postgres).

```bash
make env                  # creates .env with a random secret; then set your name and
                          # password in WORKPILOT_USER, and WORKPILOT_COOKIE_SECURE=false for http
make install              # web + api dependencies
make db                   # start Postgres in Docker, on port 5440 (POSTGRES_PORT)
make migrate              # create / update the database tables
make dev-api              # API on http://localhost:8100 (WORKPILOT_PORT)
make dev-web              # web app on http://localhost:5180 (WORKPILOT_WEB_PORT), proxies /api
make seed                 # optional: the demo data of the Grove homepage concept, see below
```

The ports avoid the usual 8000, 5173 and 5433, so WorkPilot runs next to other projects.
Change them in `.env` if one is still taken.

Then open http://localhost:5180, sign in with the name and password from `WORKPILOT_USER`,
and answer the three onboarding questions. From there:

- **⌘K** (Ctrl K) captures from anywhere: `/todo Call the editor tomorrow` (today when no day
  is given), `/block Deep work 9-11 friday`, `/idea …` (plain text is an idea), `/note …`,
  `/icebox Redo the login` (a todo without a date).
- **Today** shows the day's time blocks and todos: tick, move, link to a milestone, delete.
- **Icebox** holds the todos without a date. ❄️ on any todo puts it there; a day takes it out.
- **Review** looks back on the notes of the last 7 days, day by day.
- **Ideas & notes** lists what you captured, to read, change or delete (from the Review page).
- **Direction** holds your North Star and milestones.
- **Settings → AI → LM Studio**: start LM Studio's server, "Test" to list its models, pick one, then "Save".
  The homepage ticker then gets its messages from your model.

`make seed` fills a signed-up workspace with the concept's demo data: a North Star with five
milestones, today's time blocks, and done work that makes "time aligned" read 62%. If you already
have a North Star, `make seed REPLACE=1` puts it aside (soft-deleted, untouched) and
`make seed UNDO=1` removes the demo data and brings yours back. The homepage cards for features
not built yet (Opportunities, Learning, the season's focus, the review's time) show placeholder content from
`apps/web/src/features/home/demoData.ts`.

Data model: [docs/data-model.md](docs/data-model.md). API: [docs/api.md](docs/api.md), interactive docs at http://localhost:8100/api/docs when running. AI with LM Studio or a cloud API: [docs/ai-providers.md](docs/ai-providers.md).

`make import FILE=imports/notion.json` adds todos, ideas and notes from a JSON file (the format
is at the top of `apps/api/scripts/import_data.py`); `UNDO=1` removes them again. `imports/` is
ignored by git, for your own data.

Other commands: `make test` (needs `make db` running; the test database is created automatically), `make lint`, `make typecheck`, `make build`.

## Run with Docker

```bash
make env                    # then set WORKPILOT_USER (and WORKPILOT_COOKIE_SECURE=false for http)
docker compose up --build   # http://localhost:8100
```

WorkPilot refuses to start with the placeholder password or secret from `.env.example`.
Its Postgres stays inside Docker, so it never clashes with another database on your computer.
Port 8100 already taken? Set `WORKPILOT_PORT` in `.env`.
With LM Studio on the same Mac, use `http://host.docker.internal:1234/v1` in Settings → AI.

## Methodologies

Every feature based on a method (e.g. Hoshin Kanri, ICE scoring, spaced repetition) is documented in [docs/methodologies](docs/methodologies) and shown in the app behind an info icon.

## License

To be decided (see [docs/roadmap.md](docs/roadmap.md)).
