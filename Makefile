.PHONY: install dev-web dev-api db migrate test lint typecheck build docker

install:
	cd apps/web && pnpm install
	cd apps/api && uv sync

dev-web:
	cd apps/web && pnpm dev

dev-api:
	cd apps/api && uv run uvicorn app.main:app --reload --port 8000

db:
	docker compose up -d db

migrate:
	cd apps/api && uv run alembic upgrade head

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
