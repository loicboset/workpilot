import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.models import Reminder


def create_reminder(client: TestClient, in_space: str, **fields: object) -> dict:
    body = {"text": "Send the budget", "remind_at": "2026-10-02T14:00:00Z", **fields}
    response = client.post(f"{in_space}/reminders", json=body)
    assert response.status_code == 201
    return response.json()


def mark_sent(db: Session, reminder_id: str) -> None:
    """As the reminder job does: sent at its time."""
    reminder = db.get(Reminder, uuid.UUID(reminder_id))
    assert reminder is not None
    reminder.sent_at = reminder.remind_at
    db.commit()


def test_create_with_recurrence(client: TestClient, in_space: str) -> None:
    reminder = create_reminder(client, in_space, recurrence="FREQ=WEEKLY;BYDAY=FR")

    assert reminder["recurrence"] == "FREQ=WEEKLY;BYDAY=FR"
    assert reminder["sent_at"] is None


def test_filter_by_sent(client: TestClient, db: Session, in_space: str) -> None:
    sent = create_reminder(client, in_space, text="Already sent")
    create_reminder(client, in_space, text="Pending")
    mark_sent(db, sent["id"])

    pending = client.get(f"{in_space}/reminders", params={"sent": False}).json()

    assert [reminder["text"] for reminder in pending] == ["Pending"]


def test_rescheduling_a_sent_reminder_makes_it_pending_again(
    client: TestClient, db: Session, in_space: str
) -> None:
    reminder = create_reminder(client, in_space, remind_at="2026-09-01T09:00:00Z")
    mark_sent(db, reminder["id"])

    client.patch(
        f"{in_space}/reminders/{reminder['id']}", json={"remind_at": "2099-10-03T09:00:00Z"}
    )

    pending = client.get(f"{in_space}/reminders", params={"sent": False}).json()
    assert [pending_reminder["id"] for pending_reminder in pending] == [reminder["id"]]


@pytest.mark.parametrize(
    "rule",
    [
        "FREQ=SOMETIMES",
        "RRULE:FREQ=DAILY",
        "DTSTART:20260101T090000\nRRULE:FREQ=DAILY",
        "FREQ=DAILY;COUNT=3",
    ],
    ids=["unknown-frequency", "prefix", "dtstart", "count"],
)
def test_recurrence_must_be_a_rule_the_job_can_follow(
    client: TestClient, rule: str, in_space: str
) -> None:
    body = {"text": "x", "remind_at": "2026-10-02T14:00:00Z", "recurrence": rule}

    assert client.post(f"{in_space}/reminders", json=body).status_code == 422


def test_sent_at_cannot_be_set_by_the_client(client: TestClient, in_space: str) -> None:
    reminder = create_reminder(client, in_space)

    response = client.patch(
        f"{in_space}/reminders/{reminder['id']}", json={"sent_at": "2026-10-02T14:00:00Z"}
    )

    assert response.status_code == 422


def test_link_to_an_unknown_todo_is_rejected(client: TestClient, in_space: str) -> None:
    response = client.post(
        f"{in_space}/reminders",
        json={"text": "x", "remind_at": "2026-10-02T14:00:00Z", "todo_id": str(uuid.uuid4())},
    )
    assert response.status_code == 422
