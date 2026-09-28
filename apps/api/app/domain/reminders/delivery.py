"""Sending the reminders that are due, as push notifications to every device (ADR 0027).

A reminder is due when its time has come and it hasn't been sent for that time yet:
`remind_at <= now` and (`sent_at` is empty or older than `remind_at`). So moving a sent
reminder to a later time sends it again, and a repeating one simply moves `remind_at` on.
"""

from collections.abc import Callable
from datetime import datetime

from sqlalchemy import ColumnElement, Select, or_, select
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.db.models import Profile, PushSubscription, Reminder
from app.domain.reminders.recurrence import next_occurrence
from app.push.sender import Delivery, send_push

Sender = Callable[[PushSubscription, dict[str, str]], Delivery]


def send_due_reminders(session: Session, send: Sender = send_push) -> None:
    """The reminder job, run every minute. Tests pass their own `send`."""
    now = utcnow()
    due = session.scalars(_due_reminders(now)).all()
    if not due:
        return
    devices = list(session.scalars(select(PushSubscription)))
    timezone = _user_timezone(session)

    for reminder in due:
        deliveries = {device: send(device, _message(reminder)) for device in devices}
        for device, delivery in deliveries.items():
            if delivery is Delivery.GONE:
                session.delete(device)
                devices.remove(device)
        if deliveries and all(delivery is Delivery.RETRY for delivery in deliveries.values()):
            continue  # no device could be reached: try again on the next run

        reminder.sent_at = now
        if reminder.recurrence:
            upcoming = next_occurrence(reminder.recurrence, reminder.remind_at, now, timezone)
            if upcoming is not None:
                reminder.remind_at = upcoming
    session.commit()


def not_sent_yet() -> ColumnElement[bool]:
    """Not sent for its current time: never sent, or sent for an earlier `remind_at`."""
    return or_(Reminder.sent_at.is_(None), Reminder.sent_at < Reminder.remind_at)


def _due_reminders(now: datetime) -> Select[tuple[Reminder]]:
    return (
        select(Reminder)
        .where(Reminder.deleted_at.is_(None), Reminder.remind_at <= now, not_sent_yet())
        .order_by(Reminder.remind_at)
        # If two servers ever run this at once, each reminder is still sent only once.
        .with_for_update(skip_locked=True)
    )


def _message(reminder: Reminder) -> dict[str, str]:
    """What the app's service worker receives and turns into a notification."""
    return {"type": "reminder", "id": str(reminder.id), "text": reminder.text}


def _user_timezone(session: Session) -> str:
    profile = session.scalars(select(Profile).where(Profile.deleted_at.is_(None))).first()
    return profile.timezone if profile else "UTC"
