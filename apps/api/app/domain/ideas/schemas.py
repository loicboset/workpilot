"""Request and response shapes for ideas."""

import uuid

from pydantic import BaseModel

from app.common import InSpaceRead, InSpaceSyncRow, LongText, PartialUpdate, RequestBody


class IdeaFields(BaseModel):
    """The fields a client writes."""

    text: LongText


class IdeaCreate(IdeaFields, RequestBody):
    id: uuid.UUID | None = None


class IdeaUpdate(PartialUpdate):
    required = frozenset({"text"})

    text: LongText | None = None


class IdeaRead(InSpaceRead):
    text: str


class IdeaSyncRow(IdeaFields, InSpaceSyncRow):
    """An idea as sent by a device through sync."""
