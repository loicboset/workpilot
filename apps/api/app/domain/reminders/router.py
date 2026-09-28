"""REST routes for reminders. Sending them is a background job (not built yet)."""

import uuid

from fastapi import APIRouter, status

from app.common import (
    AwareTimestamp,
    create_row,
    get_active_or_404,
    select_rows,
    soft_delete,
    update_row,
)
from app.db.models import Reminder
from app.db.session import SessionDep
from app.domain.reminders.delivery import not_sent_yet
from app.domain.reminders.schemas import ReminderCreate, ReminderRead, ReminderUpdate

router = APIRouter(prefix="/api/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderRead])
def list_reminders(
    session: SessionDep,
    remind_from: AwareTimestamp | None = None,
    remind_to: AwareTimestamp | None = None,
    sent: bool | None = None,
    include_deleted: bool = False,
) -> list[Reminder]:
    stmt = select_rows(Reminder, include_deleted)
    if remind_from is not None:
        stmt = stmt.where(Reminder.remind_at >= remind_from)
    if remind_to is not None:
        stmt = stmt.where(Reminder.remind_at <= remind_to)
    if sent is not None:
        stmt = stmt.where(~not_sent_yet() if sent else not_sent_yet())
    stmt = stmt.order_by(Reminder.remind_at)
    return list(session.scalars(stmt))


@router.post("", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(data: ReminderCreate, session: SessionDep) -> Reminder:
    return create_row(session, Reminder, data)


@router.get("/{reminder_id}", response_model=ReminderRead)
def get_reminder(reminder_id: uuid.UUID, session: SessionDep) -> Reminder:
    return get_active_or_404(session, Reminder, reminder_id)


@router.patch("/{reminder_id}", response_model=ReminderRead)
def update_reminder(reminder_id: uuid.UUID, data: ReminderUpdate, session: SessionDep) -> Reminder:
    # Moving `remind_at` later is enough to have it sent again (see `not_sent_yet`).
    return update_row(session, get_active_or_404(session, Reminder, reminder_id), data.changes())


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: uuid.UUID, session: SessionDep) -> None:
    soft_delete(session, get_active_or_404(session, Reminder, reminder_id))
