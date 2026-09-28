# 0023. REST API conventions

- Status: Accepted
- Date: 2026-09-28

## Decision

- JSON fields in `snake_case`, the same names as the database and the offline store. URLs are `kebab-case`, plural nouns.
- Each resource has the same 5 routes: list, create, get, partial update (`PATCH`), soft delete. Done and postpone are plain `PATCH` updates, not extra routes.
- One-row resources (profile, North Star) use `GET` + `PUT` (create or replace).
- Lists return plain arrays without pagination (one user, small data).
- Request bodies reject unknown fields. Required fields can't be cleared with `null`.
- Soft-deleted rows answer `404` and are left out of lists unless `include_deleted=true`.
- Auth: a signed session cookie (Starlette `SessionMiddleware`, httpOnly, SameSite=Lax, Secure when `WORKPILOT_COOKIE_SECURE=true`, 30 days). Credentials are compared in constant time; 5 failed logins in 15 minutes block the client (in memory). All routes except health and login require the session.
- The AI key is encrypted with Fernet, using a key derived from `WORKPILOT_SECRET_KEY` with HKDF-SHA256. It is write-only through the API.

## Why

- One predictable shape for every resource keeps the web app and the sync code simple.
- SameSite=Lax keeps the cookie off cross-site POST/PATCH/DELETE requests, which protects against CSRF without extra tokens.
- Rejecting unknown fields catches client typos (`titel`) that would otherwise be silently ignored.
