.PHONY: env install dev-web dev-api db migrate test lint typecheck build docker

# Create .env from .env.example with a fresh random secret (never overwrites an existing .env).
env:
	@test ! -f .env || (echo ".env already exists: edit it instead" && exit 1)
	@secret=$$(python3 -c "import secrets; print(secrets.token_urlsafe(48))"); \
	sed "s|^WORKPILOT_SECRET_KEY=.*|WORKPILOT_SECRET_KEY=$$secret|" .env.example > .env
	@echo "Created .env with a random secret. Now set your name and password in WORKPILOT_USER."

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
