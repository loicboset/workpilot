"""Captured ideas and notes."""

import uuid

from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SyncedMixin


class Idea(SyncedMixin, Base):
    __tablename__ = "ideas"

    text: Mapped[str] = mapped_column(Text)


class Note(SyncedMixin, Base):
    __tablename__ = "notes"

    title: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("milestones.id", ondelete="SET NULL"), index=True
    )
