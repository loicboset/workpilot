"""Request and response shapes for journal entries."""

import uuid
from datetime import date
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.common import InSpaceRead, InSpaceSyncRow, PartialUpdate, RequestBody
from app.db.enums import JournalKind

# The entry's text. May be empty while writing. For a guided review, the app copies the
# template's questions into it as headings and the user writes under each one.
JournalContent = Annotated[str, StringConstraints(max_length=100_000)]


class JournalEntryFields(BaseModel):
    """The fields a client writes."""

    entry_date: date
    kind: JournalKind = JournalKind.FREE
    content: JournalContent = ""
    review_template_id: uuid.UUID | None = None


class JournalEntryCreate(JournalEntryFields, RequestBody):
    id: uuid.UUID | None = None


class JournalEntryUpdate(PartialUpdate):
    required = frozenset({"entry_date", "kind", "content"})

    entry_date: date | None = None
    kind: JournalKind | None = None
    content: JournalContent | None = None
    review_template_id: uuid.UUID | None = None


class JournalEntryRead(InSpaceRead):
    entry_date: date
    kind: JournalKind
    content: str
    review_template_id: uuid.UUID | None


class JournalEntrySyncRow(JournalEntryFields, InSpaceSyncRow):
    """A journal entry as sent by a device through sync."""
