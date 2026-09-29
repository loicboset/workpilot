"""Request and response shapes for todos."""

import uuid
from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, Field

from app.common import (
    AwareTimestamp,
    InSpaceRead,
    InSpaceSyncRow,
    PartialUpdate,
    RequestBody,
    Title,
)

# 1 = most important, 3 = least (ADR 0030).
Priority = Annotated[int, Field(ge=1, le=3)]


class TodoFields(BaseModel):
    """The fields a client writes."""

    title: Title
    notes: str | None = None
    due_date: date | None = None
    priority: Priority | None = None
    completed_at: AwareTimestamp | None = None
    milestone_id: uuid.UUID | None = None


class TodoCreate(TodoFields, RequestBody):
    """A new todo. The device may send its own UUID (offline-first, ADR 0021)."""

    id: uuid.UUID | None = None


class TodoUpdate(PartialUpdate):
    required = frozenset({"title"})

    title: Title | None = None
    notes: str | None = None
    due_date: date | None = None
    priority: Priority | None = None
    completed_at: AwareTimestamp | None = None
    milestone_id: uuid.UUID | None = None


class TodoRead(InSpaceRead):
    title: str
    notes: str | None
    due_date: date | None
    priority: int | None
    completed_at: datetime | None
    milestone_id: uuid.UUID | None


class TodoSyncRow(TodoFields, InSpaceSyncRow):
    """A todo as sent by a device through sync."""
