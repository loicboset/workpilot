"""REST routes for reminders. Sending them is a background job (not built yet)."""

import uuid

from fastapi import APIRouter, status

from app.common import (
    AwareTimestamp,
    create_row,
    get_in_space_or_404,
    select_in_space,
    soft_delete,
    update_row,
)
from app.db.models import Reminder
from app.db.session import SessionDep
from app.domain.reminders.delivery import not_sent_yet
from app.domain.reminders.schemas import ReminderCreate, ReminderRead, ReminderUpdate
from app.domain.spaces.current import CurrentSpace

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=list[ReminderRead])
def list_reminders(
    session: SessionDep,
    space: CurrentSpace,
    remind_from: AwareTimestamp | None = None,
    remind_to: AwareTimestamp | None = None,
    sent: bool | None = None,
    include_deleted: bool = False,
) -> list[Reminder]:
    stmt = select_in_space(Reminder, space.id, include_deleted)
    if remind_from is not None:
        stmt = stmt.where(Reminder.remind_at >= remind_from)
    if remind_to is not None:
        stmt = stmt.where(Reminder.remind_at <= remind_to)
    if sent is not None:
        stmt = stmt.where(~not_sent_yet() if sent else not_sent_yet())
    stmt = stmt.order_by(Reminder.remind_at)
    return list(session.scalars(stmt))


@router.post("", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(data: ReminderCreate, session: SessionDep, space: CurrentSpace) -> Reminder:
    return create_row(session, Reminder, data, space_id=space.id)


@router.get("/{reminder_id}", response_model=ReminderRead)
def get_reminder(reminder_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> Reminder:
    return get_in_space_or_404(session, Reminder, space.id, reminder_id)


@router.patch("/{reminder_id}", response_model=ReminderRead)
def update_reminder(
    reminder_id: uuid.UUID, data: ReminderUpdate, session: SessionDep, space: CurrentSpace
) -> Reminder:
    # Moving `remind_at` later is enough to have it sent again (see `not_sent_yet`).
    return update_row(
        session, get_in_space_or_404(session, Reminder, space.id, reminder_id), data.changes()
    )


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: uuid.UUID, session: SessionDep, space: CurrentSpace) -> None:
    soft_delete(session, get_in_space_or_404(session, Reminder, space.id, reminder_id))
