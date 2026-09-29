"""The reminder job: which reminders go out, to which devices, and what happens after."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.db.models import Profile, PushSubscription, Reminder, Space
from app.domain.reminders.delivery import send_due_reminders
from app.domain.reminders.recurrence import next_occurrence
from app.push.sender import Delivery


class FakeSender:
    """Records what would be pushed; answers `delivery` (or a per-device answer)."""

    def __init__(self, delivery: Delivery = Delivery.DELIVERED, **per_device: Delivery) -> None:
        self.delivery = delivery
        self.per_device = per_device
        self.sent: list[tuple[str, dict[str, str]]] = []

    def __call__(self, device: PushSubscription, message: dict[str, str]) -> Delivery:
        self.sent.append((device.device_name or "", message))
        return self.per_device.get(device.device_name or "", self.delivery)


def add_device(db: Session, name: str) -> PushSubscription:
    device = PushSubscription(
        endpoint=f"https://push.example.com/{name}", p256dh_key="k", auth_key="a", device_name=name
    )
    db.add(device)
    db.commit()
    return device


def add_space(db: Session, name: str = "Personal", **fields) -> Space:
    space = Space(name=name, slug=name.lower(), **fields)
    db.add(space)
    db.commit()
    return space


def add_reminder(
    db: Session, minutes_from_now: int, space: Space | None = None, **fields
) -> Reminder:
    """A reminder in `space`, or in a "Personal" space made for it."""
    remind_at = (utcnow() + timedelta(minutes=minutes_from_now)).replace(microsecond=0)
    space_id = (space or add_space(db)).id
    reminder = Reminder(space_id=space_id, text="Call the editor", remind_at=remind_at, **fields)
    db.add(reminder)
    db.commit()
    return reminder


def test_a_due_reminder_goes_to_every_device_once(db: Session) -> None:
    add_device(db, "phone")
    add_device(db, "laptop")
    reminder = add_reminder(db, minutes_from_now=-1)
    sender = FakeSender()

    send_due_reminders(db, send=sender)
    send_due_reminders(db, send=sender)  # the next minute

    message = {
        "type": "reminder",
        "id": str(reminder.id),
        "text": "Call the editor",
        "space": "Personal",  # shown first in the notification
        "url": "/personal/today",  # opened by a tap
    }
    assert sorted(sender.sent, key=lambda sent: sent[0]) == [
        ("laptop", message),
        ("phone", message),
    ]
    db.refresh(reminder)
    assert reminder.sent_at is not None


def test_future_and_deleted_reminders_wait(db: Session) -> None:
    add_device(db, "phone")
    space = add_space(db)
    add_reminder(db, minutes_from_now=5, space=space)
    add_reminder(db, minutes_from_now=-1, space=space, deleted_at=utcnow())
    sender = FakeSender()

    send_due_reminders(db, send=sender)

    assert sender.sent == []


def test_an_archived_spaces_reminders_are_passed_over(db: Session) -> None:
    add_device(db, "phone")
    archived = add_space(db, "Work", archived_at=utcnow())
    reminder = add_reminder(db, minutes_from_now=-1, space=archived, recurrence="FREQ=DAILY")
    first_time = reminder.remind_at
    sender = FakeSender()

    send_due_reminders(db, send=sender)

    assert sender.sent == []
    db.refresh(reminder)  # nothing piles up for when the space is restored
    assert reminder.remind_at == first_time + timedelta(days=1)


def test_a_sent_reminder_moved_later_is_sent_again(db: Session) -> None:
    add_device(db, "phone")
    # Sent 10 minutes ago for its old time, then moved to 1 minute ago.
    add_reminder(db, minutes_from_now=-1, sent_at=utcnow() - timedelta(minutes=10))
    sender = FakeSender()

    send_due_reminders(db, send=sender)

    assert len(sender.sent) == 1


def test_a_repeating_reminder_moves_to_its_next_time(db: Session) -> None:
    add_device(db, "phone")
    reminder = add_reminder(db, minutes_from_now=-1, recurrence="FREQ=DAILY")
    first_time = reminder.remind_at

    send_due_reminders(db, send=FakeSender())

    db.refresh(reminder)
    assert reminder.remind_at == first_time + timedelta(days=1)
    assert reminder.sent_at is not None and reminder.sent_at < reminder.remind_at


def test_repeating_follows_the_users_clock_when_it_changes() -> None:
    # 9:00 in Zurich is 07:00 UTC in summer and 08:00 UTC after the change on 25 October.
    nine_on_saturday = datetime(2026, 10, 24, 7, 0, tzinfo=UTC)

    upcoming = next_occurrence(
        "FREQ=DAILY", nine_on_saturday, after=nine_on_saturday, timezone="Europe/Zurich"
    )

    assert upcoming == datetime(2026, 10, 25, 8, 0, tzinfo=UTC)


def test_the_users_timezone_comes_from_the_profile(db: Session) -> None:
    db.add(Profile(first_name="Loïc", timezone="Pacific/Kiritimati"))  # UTC+14
    db.commit()
    add_device(db, "phone")
    # Every day at 00:30 in Kiritimati, i.e. 10:30 UTC the day before.
    reminder = add_reminder(db, minutes_from_now=-1, recurrence="FREQ=DAILY;BYHOUR=0;BYMINUTE=30")

    send_due_reminders(db, send=FakeSender())

    db.refresh(reminder)
    assert reminder.remind_at.astimezone(UTC).strftime("%H:%M") == "10:30"


def test_a_device_that_is_gone_is_forgotten(db: Session) -> None:
    add_device(db, "old-phone")
    add_device(db, "laptop")
    add_reminder(db, minutes_from_now=-1)

    send_due_reminders(db, send=FakeSender(**{"old-phone": Delivery.GONE}))

    remaining = [device.device_name for device in db.query(PushSubscription)]
    assert remaining == ["laptop"]


@pytest.mark.parametrize(
    ("answers", "sent_again"),
    [
        ({"phone": Delivery.RETRY, "laptop": Delivery.RETRY}, True),  # nobody got it
        ({"phone": Delivery.RETRY, "laptop": Delivery.DELIVERED}, False),  # no duplicates
        ({"phone": Delivery.FAILED, "laptop": Delivery.FAILED}, False),  # retrying won't help
    ],
    ids=["all-unreachable", "one-delivered", "refused-for-good"],
)
def test_retries_only_when_no_device_could_be_reached(
    db: Session, answers: dict[str, Delivery], sent_again: bool
) -> None:
    add_device(db, "phone")
    add_device(db, "laptop")
    reminder = add_reminder(db, minutes_from_now=-1)

    send_due_reminders(db, send=FakeSender(**answers))

    db.refresh(reminder)
    assert (reminder.sent_at is None) is sent_again


def test_without_devices_a_reminder_is_marked_sent(db: Session) -> None:
    reminder = add_reminder(db, minutes_from_now=-1)

    send_due_reminders(db, send=FakeSender())

    db.refresh(reminder)
    assert reminder.sent_at is not None
