"""Request and response shapes for milestones."""

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

Position = Annotated[int, Field(ge=0)]


class MilestoneFields(BaseModel):
    """The fields a client writes."""

    north_star_id: uuid.UUID
    title: Title
    description: str | None = None
    target_date: date | None = None
    position: Position = 0
    completed_at: AwareTimestamp | None = None


class MilestoneCreate(MilestoneFields, RequestBody):
    id: uuid.UUID | None = None


class MilestoneUpdate(PartialUpdate):
    required = frozenset({"title", "position"})

    title: Title | None = None
    description: str | None = None
    target_date: date | None = None
    position: Position | None = None
    completed_at: AwareTimestamp | None = None


class MilestoneRead(InSpaceRead):
    north_star_id: uuid.UUID
    title: str
    description: str | None
    target_date: date | None
    position: int
    completed_at: datetime | None


class MilestoneSyncRow(MilestoneFields, InSpaceSyncRow):
    """A milestone as sent by a device through sync."""
