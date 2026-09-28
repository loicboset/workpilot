"""Journaling: free entries, guided reviews and their templates."""

import uuid
from datetime import date

from sqlalchemy import JSON, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SyncedMixin
from app.db.enums import JournalKind, ReviewKind, one_of, text_enum


class ReviewTemplate(SyncedMixin, Base):
    __tablename__ = "review_templates"
    __table_args__ = (one_of("kind", ReviewKind),)

    name: Mapped[str] = mapped_column(Text)
    kind: Mapped[ReviewKind] = mapped_column(text_enum(ReviewKind))
    # List of question strings.
    questions: Mapped[list[str]] = mapped_column(JSON, default=list)


class JournalEntry(SyncedMixin, Base):
    __tablename__ = "journal_entries"
    __table_args__ = (one_of("kind", JournalKind),)

    entry_date: Mapped[date] = mapped_column(Date, index=True)
    kind: Mapped[JournalKind] = mapped_column(text_enum(JournalKind), default=JournalKind.FREE)
    content: Mapped[str] = mapped_column(Text, default="")
    review_template_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("review_templates.id", ondelete="SET NULL"), index=True
    )
