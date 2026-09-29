.PHONY: env install dev dev-web dev-api db migrate seed import test lint typecheck build docker

# The API's port: WORKPILOT_PORT from the environment or .env, else the .env.example default.
env_value = $(shell sed -n 's/^$(1)=//p' .env 2>/dev/null)
WORKPILOT_PORT ?= $(or $(call env_value,WORKPILOT_PORT),8100)

# Create .env from .env.example with a fresh random secret (never overwrites an existing .env).
env:
	@test ! -f .env || (echo ".env already exists: edit it instead" && exit 1)
	@secret=$$(python3 -c "import secrets; print(secrets.token_urlsafe(48))"); \
	sed "s|^WORKPILOT_SECRET_KEY=.*|WORKPILOT_SECRET_KEY=$$secret|" .env.example > .env
	@echo "Created .env with a random secret. Now set your name and password in WORKPILOT_USER."

install:
	cd apps/web && pnpm install
	cd apps/api && uv sync

# Postgres, the API and the web app, reloading on each change. Ctrl+C stops the API and the web
# app; Postgres keeps running (`docker compose stop db` stops it).
dev: db
	@$(MAKE) -j2 dev-api dev-web

dev-web:
	cd apps/web && pnpm dev

dev-api:
	cd apps/api && uv run uvicorn app.main:app --reload --port $(WORKPILOT_PORT)

db:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d db

migrate:
	cd apps/api && uv run alembic upgrade head

# Demo data from the Grove concept (development). REPLACE=1 puts your North Star aside,
# UNDO=1 removes the demo data and brings it back.
seed:
	cd apps/api && uv run python -m scripts.seed_demo $(if $(REPLACE),--replace) $(if $(UNDO),--undo)

# Todos, ideas and notes from a JSON file (format: apps/api/scripts/import_data.py), e.g.
# `make import FILE=imports/notion.json`. UNDO=1 removes what the file added.
import:
	@test -n "$(FILE)" || (echo "Give the file: make import FILE=imports/notion.json" && exit 1)
	cd apps/api && uv run python -m scripts.import_data "$(abspath $(FILE))" $(if $(UNDO),--undo)

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
