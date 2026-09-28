"""Request and response shapes for reminders."""

import uuid
from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, StringConstraints

from app.common import AwareTimestamp, PartialUpdate, RequestBody, SyncedRead, SyncRow, Title
from app.domain.reminders.recurrence import check_rule

# An iCal recurrence rule, e.g. "FREQ=WEEKLY;BYDAY=FR" for every Friday.
Recurrence = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=500),
    AfterValidator(check_rule),
]


class ReminderFields(BaseModel):
    """The fields a client writes. `sent_at` belongs to the server."""

    text: Title
    remind_at: AwareTimestamp
    recurrence: Recurrence | None = None
    todo_id: uuid.UUID | None = None
    time_block_id: uuid.UUID | None = None


class ReminderCreate(ReminderFields, RequestBody):
    id: uuid.UUID | None = None


class ReminderUpdate(PartialUpdate):
    required = frozenset({"text", "remind_at"})

    text: Title | None = None
    remind_at: AwareTimestamp | None = None
    recurrence: Recurrence | None = None
    todo_id: uuid.UUID | None = None
    time_block_id: uuid.UUID | None = None


class ReminderRead(SyncedRead):
    text: str
    remind_at: datetime
    recurrence: str | None
    sent_at: datetime | None  # set by the server when the notification goes out
    todo_id: uuid.UUID | None
    time_block_id: uuid.UUID | None


class ReminderSyncRow(ReminderFields, SyncRow):
    """A reminder as sent by a device through sync."""
