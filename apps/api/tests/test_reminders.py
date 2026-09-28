import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import utcnow
from app.db.models import Reminder


def create_reminder(client: TestClient, **fields: object) -> dict:
    body = {"text": "Send the budget", "remind_at": "2026-10-02T14:00:00Z", **fields}
    response = client.post("/api/reminders", json=body)
    assert response.status_code == 201
    return response.json()


def mark_sent(db: Session, reminder_id: str) -> None:
    reminder = db.get(Reminder, uuid.UUID(reminder_id))
    assert reminder is not None
    reminder.sent_at = utcnow()
    db.commit()


def test_create_with_recurrence(client: TestClient) -> None:
    reminder = create_reminder(client, recurrence="FREQ=WEEKLY;BYDAY=FR")

    assert reminder["recurrence"] == "FREQ=WEEKLY;BYDAY=FR"
    assert reminder["sent_at"] is None


def test_filter_by_sent(client: TestClient, db: Session) -> None:
    sent = create_reminder(client, text="Already sent")
    create_reminder(client, text="Pending")
    mark_sent(db, sent["id"])

    pending = client.get("/api/reminders", params={"sent": False}).json()

    assert [reminder["text"] for reminder in pending] == ["Pending"]


def test_rescheduling_resets_sent_at(client: TestClient, db: Session) -> None:
    reminder = create_reminder(client)
    mark_sent(db, reminder["id"])

    rescheduled = client.patch(
        f"/api/reminders/{reminder['id']}", json={"remind_at": "2026-10-03T09:00:00Z"}
    ).json()

    assert rescheduled["sent_at"] is None


def test_sent_at_cannot_be_set_by_the_client(client: TestClient) -> None:
    reminder = create_reminder(client)

    response = client.patch(
        f"/api/reminders/{reminder['id']}", json={"sent_at": "2026-10-02T14:00:00Z"}
    )

    assert response.status_code == 422


def test_link_to_an_unknown_todo_is_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/reminders",
        json={"text": "x", "remind_at": "2026-10-02T14:00:00Z", "todo_id": str(uuid.uuid4())},
    )
    assert response.status_code == 422
