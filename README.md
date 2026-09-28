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
cp .env.example .env      # edit WORKPILOT_USER, WORKPILOT_SECRET_KEY;
                          # set WORKPILOT_COOKIE_SECURE=false for local http
make install              # web + api dependencies
make db                   # start Postgres in Docker
make migrate              # create / update the database tables
make dev-api              # API on http://localhost:8000
make dev-web              # web app on http://localhost:5173 (proxies /api)
```

Data model: [docs/data-model.md](docs/data-model.md). API: [docs/api.md](docs/api.md), interactive docs at http://localhost:8000/api/docs when running. AI with LM Studio or a cloud API: [docs/ai-providers.md](docs/ai-providers.md).

Other commands: `make test` (needs `make db` running; the test database is created automatically), `make lint`, `make typecheck`, `make build`.

## Run with Docker

```bash
cp .env.example .env
docker compose up --build   # http://localhost:8000
```

## Methodologies

Every feature based on a method (e.g. Hoshin Kanri, ICE scoring, spaced repetition) is documented in [docs/methodologies](docs/methodologies) and shown in the app behind an info icon.

## License

To be decided (see [docs/roadmap.md](docs/roadmap.md)).
