"""Request and response shapes for ideas."""

import uuid

from pydantic import BaseModel

from app.common import LongText, PartialUpdate, RequestBody, SyncedRead, SyncRow


class IdeaFields(BaseModel):
    """The fields a client writes."""

    text: LongText


class IdeaCreate(IdeaFields, RequestBody):
    id: uuid.UUID | None = None


class IdeaUpdate(PartialUpdate):
    required = frozenset({"text"})

    text: LongText | None = None


class IdeaRead(SyncedRead):
    text: str


class IdeaSyncRow(IdeaFields, SyncRow):
    """An idea as sent by a device through sync."""
