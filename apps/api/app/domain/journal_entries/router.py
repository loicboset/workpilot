"""REST routes for journal entries."""

import uuid
from datetime import date

from fastapi import APIRouter, status

from app.common import create_row, get_in_space_or_404, select_in_space, soft_delete, update_row
from app.db.enums import JournalKind
from app.db.models import JournalEntry
from app.db.session import SessionDep
from app.domain.journal_entries.schemas import (
    JournalEntryCreate,
    JournalEntryRead,
    JournalEntryUpdate,
)
from app.domain.spaces.current import CurrentSpace

router = APIRouter(prefix="/journal-entries", tags=["journal entries"])


@router.get("", response_model=list[JournalEntryRead])
def list_journal_entries(
    session: SessionDep,
    space: CurrentSpace,
    entry_from: date | None = None,
    entry_to: date | None = None,
    kind: JournalKind | None = None,
    include_deleted: bool = False,
) -> list[JournalEntry]:
    stmt = select_in_space(JournalEntry, space.id, include_deleted)
    if entry_from is not None:
        stmt = stmt.where(JournalEntry.entry_date >= entry_from)
    if entry_to is not None:
        stmt = stmt.where(JournalEntry.entry_date <= entry_to)
    if kind is not None:
        stmt = stmt.where(JournalEntry.kind == kind)
    stmt = stmt.order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc())
    return list(session.scalars(stmt))


@router.post("", response_model=JournalEntryRead, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    data: JournalEntryCreate, session: SessionDep, space: CurrentSpace
) -> JournalEntry:
    return create_row(session, JournalEntry, data, space_id=space.id)


@router.get("/{entry_id}", response_model=JournalEntryRead)
def get_journal_entry(
    entry_id: uuid.UUID, session: SessionDep, space: CurrentSpace
) -> JournalEntry:
    return get_in_space_or_404(session, JournalEntry, space.id, entry_id)


@router.patch("/{entry_id}", response_model=JournalEntryRead)
def update_journal_entry(
    entry_id: uuid.UUID, data: JournalEntryUpdate, session: SessionDep, space: CurrentSpace
) -> JournalEntry:
    entry = get_in_space_or_404(session, JournalEntry, space.id, entry_id)
    return update_row(session, entry, data.changes())


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_journal_entry(entry_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> None:
    soft_delete(session, get_in_space_or_404(session, JournalEntry, space.id, entry_id))
