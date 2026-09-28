"""Pieces shared by every router: field types, base schemas and data helpers."""

import uuid
from datetime import UTC, datetime
from typing import Annotated, ClassVar, Self

from fastapi import HTTPException, status
from pydantic import (
    AfterValidator,
    AwareDatetime,
    BaseModel,
    ConfigDict,
    StringConstraints,
    model_validator,
)
from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.base import SyncedMixin, utcnow

# --- Field types ---------------------------------------------------------------------------

# A short required text (titles, names): trimmed, 1 to 500 characters.
Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]

# A longer required text (ideas, note content): trimmed, 1 to 20,000 characters.
LongText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20_000)]

# A timestamp sent by the client: must include a timezone, normalised to UTC.
AwareTimestamp = Annotated[AwareDatetime, AfterValidator(lambda value: value.astimezone(UTC))]


# --- Base schemas --------------------------------------------------------------------------


class RequestBody(BaseModel):
    """Base for request bodies: unknown fields are rejected, so a typo never goes unnoticed."""

    model_config = ConfigDict(extra="forbid")


class SyncedRead(BaseModel):
    """Fields every synced resource returns (ADR 0021)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None


class SyncRow(BaseModel):
    """A full row sent by a device through sync (ADR 0025).

    Subclasses add the resource's own fields. Fields the server owns (e.g. `revision`,
    `sent_at`) are not part of it and are ignored when a device sends them back.
    """

    model_config = ConfigDict(extra="ignore")

    id: uuid.UUID
    created_at: AwareTimestamp
    updated_at: AwareTimestamp
    deleted_at: AwareTimestamp | None = None


class PartialUpdate(RequestBody):
    """Base for PATCH bodies: only the fields sent change; null clears an optional field.

    Subclasses list in `required` the fields that can be changed but never cleared.
    """

    required: ClassVar[frozenset[str]] = frozenset()

    @model_validator(mode="after")
    def reject_clearing_required_fields(self) -> Self:
        for field in sorted(self.required & self.model_fields_set):
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self

    def changes(self) -> dict[str, object]:
        """The fields the client sent, with their new values."""
        return self.model_dump(exclude_unset=True)


# --- Data helpers --------------------------------------------------------------------------


def select_rows[Row: SyncedMixin](
    model: type[Row], include_deleted: bool = False
) -> Select[tuple[Row]]:
    """SELECT the rows of a synced table, leaving out soft-deleted ones unless asked."""
    stmt = select(model)
    if not include_deleted:
        stmt = stmt.where(model.deleted_at.is_(None))
    return stmt


def get_active_or_404[Row: SyncedMixin](
    session: Session, model: type[Row], row_id: uuid.UUID
) -> Row:
    """Return the row if it exists and is not soft-deleted; otherwise answer 404."""
    row = session.get(model, row_id)
    if row is None or row.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    return row


def create_row[Row: SyncedMixin](session: Session, model: type[Row], data: BaseModel) -> Row:
    """Insert a row from a create body. Fields left empty keep their column defaults."""
    row = model(**data.model_dump(exclude_none=True))
    session.add(row)
    session.commit()
    return row


def update_row[Row: SyncedMixin](session: Session, row: Row, changes: dict[str, object]) -> Row:
    """Apply field changes to a row and save it."""
    for field, value in changes.items():
        setattr(row, field, value)
    session.commit()
    return row


def soft_delete(session: Session, row: SyncedMixin) -> None:
    """Mark the row deleted. It stays in the table so the deletion syncs to every device."""
    row.deleted_at = utcnow()
    session.commit()


# --- One-row tables (profile, North Star) ---------------------------------------------------


def get_singleton_or_404[Row: SyncedMixin](session: Session, model: type[Row]) -> Row:
    """Return the only active row of a one-row table, or answer 404 if there is none yet."""
    row = get_singleton(session, model)
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")
    return row


def put_singleton[Row: SyncedMixin](session: Session, model: type[Row], data: BaseModel) -> Row:
    """Create the row of a one-row table, or replace all its fields (PUT semantics)."""
    row = get_singleton(session, model)
    if row is None:
        return create_row(session, model, data)
    return update_row(session, row, data.model_dump(exclude={"id"}))


def get_singleton[Row: SyncedMixin](session: Session, model: type[Row]) -> Row | None:
    """The only active row of a one-row table (the oldest, if two devices made one offline)."""
    stmt = select_rows(model).order_by(model.created_at).limit(1)
    return session.scalars(stmt).first()
