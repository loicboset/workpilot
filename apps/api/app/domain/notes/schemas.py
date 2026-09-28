"""Request and response shapes for notes."""

import uuid

from pydantic import BaseModel

from app.common import LongText, PartialUpdate, RequestBody, SyncedRead, SyncRow, Title


class NoteFields(BaseModel):
    """The fields a client writes."""

    title: Title | None = None
    content: LongText
    milestone_id: uuid.UUID | None = None


class NoteCreate(NoteFields, RequestBody):
    id: uuid.UUID | None = None


class NoteUpdate(PartialUpdate):
    required = frozenset({"content"})

    title: Title | None = None
    content: LongText | None = None
    milestone_id: uuid.UUID | None = None


class NoteRead(SyncedRead):
    title: str | None
    content: str
    milestone_id: uuid.UUID | None


class NoteSyncRow(NoteFields, SyncRow):
    """A note as sent by a device through sync."""
