"""Planning: todos, time blocks and reminders (ADR 0017, 0011)."""

import uuid
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, ForeignKey, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, SyncedMixin


class Todo(SyncedMixin, Base):
    __tablename__ = "todos"
    __table_args__ = (CheckConstraint("priority BETWEEN 1 AND 3", name="priority_1_to_3"),)

    title: Mapped[str] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[date | None] = mapped_column(Date, index=True)
    # 1 = most important, 3 = least; None = no priority (ADR 0030).
    priority: Mapped[int | None] = mapped_column(SmallInteger)
    completed_at: Mapped[datetime | None]
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("milestones.id", ondelete="SET NULL"), index=True
    )


class TimeBlock(SyncedMixin, Base):
    __tablename__ = "time_blocks"
    __table_args__ = (CheckConstraint("end_at > start_at", name="end_after_start"),)

    title: Mapped[str] = mapped_column(Text)
    start_at: Mapped[datetime] = mapped_column(index=True)
    end_at: Mapped[datetime]
    completed_at: Mapped[datetime | None]
    milestone_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("milestones.id", ondelete="SET NULL"), index=True
    )


class Reminder(SyncedMixin, Base):
    __tablename__ = "reminders"

    text: Mapped[str] = mapped_column(Text)
    remind_at: Mapped[datetime] = mapped_column(index=True)
    # iCal RRULE, e.g. "FREQ=WEEKLY;BYDAY=FR" (ADR 0011).
    recurrence: Mapped[str | None] = mapped_column(Text)
    sent_at: Mapped[datetime | None]
    todo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("todos.id", ondelete="SET NULL"), index=True
    )
    time_block_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("time_blocks.id", ondelete="SET NULL"), index=True
    )
