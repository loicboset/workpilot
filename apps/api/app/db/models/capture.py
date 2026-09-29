"""Captured ideas and notes."""

import uuid

from sqlalchemy import Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, InSpaceMixin, link_in_space


class Idea(InSpaceMixin, Base):
    __tablename__ = "ideas"

    text: Mapped[str] = mapped_column(Text)


class Note(InSpaceMixin, Base):
    __tablename__ = "notes"
    __table_args__ = (link_in_space("milestone_id", "milestones"),)

    title: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str] = mapped_column(Text)
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(index=True)
