"""Request and response shapes for sync."""

from typing import Annotated, Any

from pydantic import BaseModel, Field

from app.common import RequestBody

MAX_PUSH_CHANGES = 500


class Change(BaseModel):
    """One row of one synced table, e.g. {"table": "todos", "row": {...}}."""

    table: str
    row: dict[str, Any]


class PullResponse(BaseModel):
    changes: list[Change]
    # Send it back as `since` next time. Equals `since` when nothing changed.
    cursor: int
    # True when more changes are waiting: pull again right away.
    has_more: bool


class PushRequest(RequestBody):
    changes: Annotated[list[Change], Field(max_length=MAX_PUSH_CHANGES)]


class RejectedChange(BaseModel):
    table: str
    id: str | None
    reason: str


class PushResponse(BaseModel):
    """What happened to each pushed row, by id."""

    applied: list[str] = []
    # The server already had a more recent version; it comes back on the next pull.
    skipped: list[str] = []
    # Could not be written (unknown table, invalid row, link to a missing row).
    rejected: list[RejectedChange] = []
