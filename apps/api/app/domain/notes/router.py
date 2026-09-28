"""REST routes for notes."""

import uuid

from fastapi import APIRouter, status

from app.common import create_row, get_active_or_404, select_rows, soft_delete, update_row
from app.db.models import Note
from app.db.session import SessionDep
from app.domain.notes.schemas import NoteCreate, NoteRead, NoteUpdate

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=list[NoteRead])
def list_notes(
    session: SessionDep,
    milestone_id: uuid.UUID | None = None,
    include_deleted: bool = False,
) -> list[Note]:
    stmt = select_rows(Note, include_deleted)
    if milestone_id is not None:
        stmt = stmt.where(Note.milestone_id == milestone_id)
    stmt = stmt.order_by(Note.updated_at.desc())  # most recently edited first
    return list(session.scalars(stmt))


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(data: NoteCreate, session: SessionDep) -> Note:
    return create_row(session, Note, data)


@router.get("/{note_id}", response_model=NoteRead)
def get_note(note_id: uuid.UUID, session: SessionDep) -> Note:
    return get_active_or_404(session, Note, note_id)


@router.patch("/{note_id}", response_model=NoteRead)
def update_note(note_id: uuid.UUID, data: NoteUpdate, session: SessionDep) -> Note:
    note = get_active_or_404(session, Note, note_id)
    return update_row(session, note, data.changes())


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(note_id: uuid.UUID, session: SessionDep) -> None:
    soft_delete(session, get_active_or_404(session, Note, note_id))
