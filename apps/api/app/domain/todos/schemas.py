"""Request and response shapes for todos."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.common import AwareTimestamp, PartialUpdate, RequestBody, SyncedRead, SyncRow, Title


class TodoFields(BaseModel):
    """The fields a client writes."""

    title: Title
    notes: str | None = None
    due_date: date | None = None
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
    completed_at: AwareTimestamp | None = None
    milestone_id: uuid.UUID | None = None


class TodoRead(SyncedRead):
    title: str
    notes: str | None
    due_date: date | None
    completed_at: datetime | None
    milestone_id: uuid.UUID | None


class TodoSyncRow(TodoFields, SyncRow):
    """A todo as sent by a device through sync."""
