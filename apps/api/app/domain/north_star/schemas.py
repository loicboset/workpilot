"""Request and response shapes for the North Star."""

import uuid
from datetime import date

from pydantic import BaseModel

from app.common import RequestBody, SyncedRead, SyncRow, Title


class NorthStarFields(BaseModel):
    """The fields a client writes."""

    title: Title
    description: str | None = None
    target_date: date | None = None


class NorthStarWrite(NorthStarFields, RequestBody):
    """The whole North Star (PUT replaces every field). `id` is only used when it is created."""

    id: uuid.UUID | None = None


class NorthStarRead(SyncedRead):
    title: str
    description: str | None
    target_date: date | None


class NorthStarSyncRow(NorthStarFields, SyncRow):
    """The North Star as sent by a device through sync."""
