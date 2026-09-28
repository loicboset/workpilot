"""Sync routes (ADR 0025): devices push their offline changes, then pull everyone else's."""

from typing import Annotated

from fastapi import APIRouter, Query

from app.db.session import SessionDep
from app.sync.schemas import PullResponse, PushRequest, PushResponse
from app.sync.service import pull_changes, push_changes

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.get("/pull", response_model=PullResponse)
def pull(
    session: SessionDep,
    since: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=1000)] = 500,
) -> PullResponse:
    """Rows changed after `since` (a cursor from the previous pull), oldest change first."""
    return pull_changes(session, since, limit)


@router.post("/push", response_model=PushResponse)
def push(data: PushRequest, session: SessionDep) -> PushResponse:
    """Rows changed on the device. Most recent edit wins."""
    return push_changes(session, data.changes)
