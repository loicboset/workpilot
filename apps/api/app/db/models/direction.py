"""Direction: the North Star and its milestones (ADR 0013), one of each set per space."""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, InSpaceMixin, link_in_space, linkable_in_space


class NorthStar(InSpaceMixin, Base):
    __tablename__ = "north_stars"
    __table_args__ = (linkable_in_space(),)

    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    target_date: Mapped[date | None] = mapped_column(Date)


class Milestone(InSpaceMixin, Base):
    __tablename__ = "milestones"
    __table_args__ = (
        link_in_space("north_star_id", "north_stars", cascade=True),
        linkable_in_space(),
    )

    north_star_id: Mapped[uuid.UUID] = mapped_column(index=True)
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    target_date: Mapped[date | None] = mapped_column(Date)
    position: Mapped[int] = mapped_column(Integer, default=0)
    completed_at: Mapped[datetime | None]
