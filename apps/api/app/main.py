"""FastAPI entry point.

Serves the JSON API under /api and, in production, the built web app (apps/web/dist copied
to app/static by the Docker build) so WorkPilot runs as a single container. Background jobs
(reminders) run in the same process while the app runs.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.exc import IntegrityError
from starlette.middleware.sessions import SessionMiddleware

from app import __version__
from app.ai.providers import AIError
from app.ai.router import router as ai_router
from app.auth.router import router as auth_router
from app.auth.security import SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, require_login
from app.config import settings
from app.domain.ideas.router import router as ideas_router
from app.domain.journal_entries.router import router as journal_entries_router
from app.domain.milestones.router import router as milestones_router
from app.domain.north_star.router import router as north_star_router
from app.domain.notes.router import router as notes_router
from app.domain.profile.router import router as profile_router
from app.domain.reminders.router import router as reminders_router
from app.domain.review_templates.router import router as review_templates_router
from app.domain.spaces.router import router as spaces_router
from app.domain.ticker_messages.router import router as ticker_messages_router
from app.domain.time_blocks.router import router as time_blocks_router
from app.domain.todos.router import router as todos_router
from app.errors import ai_error_handler, integrity_error_handler
from app.jobs import scheduled_jobs
from app.jobs.runner import running_jobs
from app.push.router import router as push_router
from app.sync.router import router as sync_router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    async with running_jobs(scheduled_jobs()):
        yield


app = FastAPI(
    title="WorkPilot API",
    version=__version__,
    # Keep every server URL under /api; the rest belongs to the web app.
    docs_url="/api/docs",
    swagger_ui_oauth2_redirect_url="/api/docs/oauth2-redirect",
    redoc_url=None,
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)
app.add_exception_handler(IntegrityError, integrity_error_handler)
app.add_exception_handler(AIError, ai_error_handler)
# Signed session cookie (ADR 0003). SameSite=Lax keeps it off cross-site POST/PATCH/DELETE.
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.secret_key,
    session_cookie=SESSION_COOKIE,
    max_age=SESSION_MAX_AGE_SECONDS,
    same_site="lax",
    https_only=settings.cookie_secure,
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}


# Public: logging in. Everything else requires a signed-in session.
app.include_router(auth_router)

# Everything of a space lives under its id: /api/spaces/{space_id}/todos… (ADR 0031).
in_space = APIRouter(prefix="/api/spaces/{space_id}")
for router in [
    north_star_router,
    milestones_router,
    todos_router,
    time_blocks_router,
    reminders_router,
    ideas_router,
    notes_router,
    journal_entries_router,
    review_templates_router,
    ticker_messages_router,
    ai_router,
]:
    in_space.include_router(router)

PROTECTED_ROUTERS = [
    spaces_router,
    in_space,
    profile_router,
    push_router,
    sync_router,
]
for router in PROTECTED_ROUTERS:
    app.include_router(router, dependencies=[Depends(require_login)])


STATIC_DIR = (Path(__file__).parent / "static").resolve()

if STATIC_DIR.is_dir():

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        """Serve built files; fall back to index.html for client-side routes."""
        if path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = (STATIC_DIR / path).resolve()
        if candidate.is_file() and candidate.is_relative_to(STATIC_DIR):
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
