# 0024. PostgreSQL only

- Status: Accepted
- Date: 2026-09-28

## Decision

WorkPilot uses PostgreSQL, and only PostgreSQL, in production, development and tests. SQLite is not supported.

## Consequences

- The code uses PostgreSQL features directly: `timestamptz` columns (sessions run in UTC), PostgreSQL error classes (`psycopg.errors.UniqueViolation`), plain Alembic migrations (no SQLite batch mode).
- Tests need a running PostgreSQL (`make db`); the test database `workpilot_test` is created automatically.
- Self-hosting runs two containers: the app and PostgreSQL.
