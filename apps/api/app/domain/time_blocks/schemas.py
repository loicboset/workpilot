"""Request and response shapes for time blocks."""

import uuid
from datetime import datetime

from pydantic import BaseModel

from app.common import (
    AwareTimestamp,
    InSpaceRead,
    InSpaceSyncRow,
    PartialUpdate,
    RequestBody,
    Title,
)


class TimeBlockFields(BaseModel):
    """The fields a client writes. `end_at` must be after `start_at` (checked by the database)."""

    title: Title
    start_at: AwareTimestamp
    end_at: AwareTimestamp
    completed_at: AwareTimestamp | None = None
    milestone_id: uuid.UUID | None = None


class TimeBlockCreate(TimeBlockFields, RequestBody):
    id: uuid.UUID | None = None


class TimeBlockUpdate(PartialUpdate):
    required = frozenset({"title", "start_at", "end_at"})

    title: Title | None = None
    start_at: AwareTimestamp | None = None
    end_at: AwareTimestamp | None = None
    completed_at: AwareTimestamp | None = None
    milestone_id: uuid.UUID | None = None


class TimeBlockRead(InSpaceRead):
    title: str
    start_at: datetime
    end_at: datetime
    completed_at: datetime | None
    milestone_id: uuid.UUID | None


class TimeBlockSyncRow(TimeBlockFields, InSpaceSyncRow):
    """A time block as sent by a device through sync."""
