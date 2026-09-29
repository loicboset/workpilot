"""Declarative base and the columns shared by every synced table."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    FetchedValue,
    ForeignKey,
    ForeignKeyConstraint,
    MetaData,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Stable constraint names so Alembic migrations stay reproducible.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


def utcnow() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    # Every `Mapped[datetime]` column is a PostgreSQL timestamptz.
    type_annotation_map = {datetime: DateTime(timezone=True)}


class SyncedMixin:
    """Columns shared by every table that syncs to the browser (ADR 0021)."""

    # Generated on the device, so rows can be created offline.
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=utcnow, onupdate=utcnow)
    # Soft delete: a deletion must reach every device.
    deleted_at: Mapped[datetime | None]
    # Sync position, set by a database trigger on every insert and update (ADR 0025).
    revision: Mapped[int] = mapped_column(
        BigInteger, server_default=FetchedValue(), server_onupdate=FetchedValue(), index=True
    )


class InSpaceMixin(SyncedMixin):
    """A synced row that belongs to one space and never moves to another (ADR 0031).

    Links between such rows go through two-column foreign keys, `(space_id, milestone_id)` →
    `milestones (space_id, id)`, so the database refuses a link from one space to another.
    """

    space_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("spaces.id", ondelete="CASCADE"), index=True
    )


def link_in_space(column: str, table: str, *, cascade: bool = False) -> ForeignKeyConstraint:
    """A link to a row of `table` in the same space: `(space_id, column)` → `table (space_id, id)`.

    Deleting that row clears the link, or with `cascade` deletes this row too.
    """
    return ForeignKeyConstraint(
        ["space_id", column],
        [f"{table}.space_id", f"{table}.id"],
        ondelete="CASCADE" if cascade else f"SET NULL ({column})",
    )


def linkable_in_space() -> UniqueConstraint:
    """Lets rows of the same space link here with `link_in_space`."""
    return UniqueConstraint("space_id", "id")
