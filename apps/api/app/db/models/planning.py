"""Planning: todos, time blocks and reminders (ADR 0017, 0011)."""

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, InSpaceMixin, link_in_space, linkable_in_space


class Todo(InSpaceMixin, Base):
    __tablename__ = "todos"
    __table_args__ = (
        CheckConstraint("priority BETWEEN 1 AND 3", name="priority_1_to_3"),
        link_in_space("milestone_id", "milestones"),
        linkable_in_space(),
    )

    title: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[date | None] = mapped_column(Date, index=True)
    # 1 = most important, 3 = least; None = no priority (ADR 0030).
    priority: Mapped[int | None] = mapped_column(SmallInteger)
    completed_at: Mapped[datetime | None]
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(index=True)


class TimeBlock(InSpaceMixin, Base):
    __tablename__ = "time_blocks"
    __table_args__ = (
        CheckConstraint("end_at > start_at", name="end_after_start"),
        link_in_space("milestone_id", "milestones"),
        linkable_in_space(),
    )

    title: Mapped[str] = mapped_column(Text)
    start_at: Mapped[datetime] = mapped_column(index=True)
    end_at: Mapped[datetime]
    completed_at: Mapped[datetime | None]
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(index=True)


class Reminder(InSpaceMixin, Base):
    __tablename__ = "reminders"
    __table_args__ = (
        link_in_space("todo_id", "todos"),
        link_in_space("time_block_id", "time_blocks"),
    )

    text: Mapped[str] = mapped_column(Text)
    remind_at: Mapped[datetime] = mapped_column(index=True)
    # iCal RRULE, e.g. "FREQ=WEEKLY;BYDAY=FR" (ADR 0011).
    recurrence: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None]
    todo_id: Mapped[uuid.UUID | None] = mapped_column(index=True)
    time_block_id: Mapped[uuid.UUID | None] = mapped_column(index=True)
