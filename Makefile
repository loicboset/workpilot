.PHONY: env install dev db migrate seed import test lint typecheck build docker

# Create .env from .env.example with a fresh random secret (never overwrites an existing .env).
env:
	@test ! -f .env || (echo ".env already exists: edit it instead" && exit 1)
	@secret=$$(python3 -c "import secrets; print(secrets.token_urlsafe(48))"); \
	sed "s|^WORKPILOT_SECRET_KEY=.*|WORKPILOT_SECRET_KEY=$$secret|" .env.example > .env
	@echo "Created .env with a random secret. Now set your name and password in WORKPILOT_USER."

install:
	cd apps/web && pnpm install
	cd apps/api && uv sync

DEV_COMPOSE = docker compose -f docker-compose.yml -f docker-compose.dev.yml

# Postgres, the API and the web app, all in Docker and reloading on each change
# (docker-compose.dev.yml). Ctrl+C stops the API and the web app; Postgres keeps running
# (`docker compose stop db` stops it).
dev:
	$(DEV_COMPOSE) up --build api web

db:
	$(DEV_COMPOSE) up -d db

migrate:
	cd apps/api && uv run alembic upgrade head

# Demo data from the Grove concept (development). REPLACE=1 puts your North Star aside,
# UNDO=1 removes the demo data and brings it back. SPACE=work: the space at /work, not the first.
seed:
	cd apps/api && uv run python -m scripts.seed_demo $(if $(REPLACE),--replace) $(if $(UNDO),--undo) $(if $(SPACE),--space "$(SPACE)")

# Todos, ideas and notes from a JSON file (format: apps/api/scripts/import_data.py), e.g.
# `make import FILE=imports/notion.json`. UNDO=1 removes what the file added. SPACE=work: into
# the space at /work, not the first.
import:
	@test -n "$(FILE)" || (echo "Give the file: make import FILE=imports/notion.json" && exit 1)
	cd apps/api && uv run python -m scripts.import_data "$(abspath $(FILE))" $(if $(UNDO),--undo) $(if $(SPACE),--space "$(SPACE)")

test:
	cd apps/web && pnpm test
	cd apps/api && uv run pytest

lint:
	cd apps/web && pnpm lint
	cd apps/api && uv run ruff check . && uv run ruff format --check .

typecheck:
	cd apps/web && pnpm typecheck

build:
	cd apps/web && pnpm build

docker:
	docker compose up --build
