# 0020. Repository layout and packaging

- Status: Accepted
- Date: 2026-09-28

## Decision

Monorepo with `apps/web` (React PWA), `apps/api` (FastAPI) and `docs`. One Docker image: FastAPI serves the built web app. Postgres runs as a second container bound to localhost. Tooling: pnpm (web), uv (API). Fonts are self-hosted (Fontsource). i18n uses i18next.

## Why

One image keeps hosting light. Self-hosted fonts work offline and don't leak visits to a third party.
