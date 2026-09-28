"""Declarative base and the columns shared by every synced table."""

import uuid
from datetime import UTC, datetime

from sqlalchemy import BigInteger, DateTime, FetchedValue, MetaData, Uuid
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
