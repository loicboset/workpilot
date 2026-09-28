# auth

Sign-in page and session (ADR 0002, 0003). `session.ts` asks the server who is signed in; `RequireSession` (in `app/`) guards the signed-in pages and stays open offline.
