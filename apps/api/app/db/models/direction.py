"""Direction: the North Star and its milestones (ADR 0013)."""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SyncedMixin


class NorthStar(SyncedMixin, Base):
    __tablename__ = "north_stars"

    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    target_date: Mapped[date | None] = mapped_column(Date)


class Milestone(SyncedMixin, Base):
    __tablename__ = "milestones"

    north_star_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("north_stars.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    target_date: Mapped[date | None] = mapped_column(Date)
    position: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None]
