"""Sync: pull by revision, push with "most recent edit wins" (ADR 0025)."""

import uuid
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base, SyncedMixin
from app.db.enums import TickerKind
from app.db.models import Reminder, TickerMessage
from app.sync.tables import SYNCED_TABLES


def pull(client: TestClient, since: int = 0, limit: int = 500) -> dict:
    response = client.get("/api/sync/pull", params={"since": since, "limit": limit})
    assert response.status_code == 200
    return response.json()


def push(client: TestClient, *changes: tuple[str, dict]) -> dict:
    body = {"changes": [{"table": table, "row": row} for table, row in changes]}
    response = client.post("/api/sync/push", json=body)
    assert response.status_code == 200
    return response.json()


def timestamp(minutes_ago: float = 0) -> str:
    return (datetime.now(UTC) - timedelta(minutes=minutes_ago)).isoformat()


def todo_row(title: str = "Draft", minutes_ago: float = 0, **fields: object) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "title": title,
        "created_at": timestamp(minutes_ago),
        "updated_at": timestamp(minutes_ago),
        **fields,
    }


def test_every_synced_model_is_registered() -> None:
    synced_models = {
        mapper.class_ for mapper in Base.registry.mappers if issubclass(mapper.class_, SyncedMixin)
    }
    assert synced_models == {table.model for table in SYNCED_TABLES}


# --- Pull -----------------------------------------------------------------------------------


def test_pull_returns_changes_in_order_with_a_cursor(client: TestClient) -> None:
    client.post("/api/ideas", json={"text": "first"})
    client.post("/api/todos", json={"title": "second"})

    result = pull(client)

    assert [change["table"] for change in result["changes"]] == ["ideas", "todos"]
    assert result["changes"][0]["row"]["text"] == "first"
    assert result["changes"][1]["row"]["title"] == "second"
    assert result["has_more"] is False
    assert pull(client, since=result["cursor"])["changes"] == []


def test_pull_pages_with_limit(client: TestClient) -> None:
    for number in range(3):
        client.post("/api/ideas", json={"text": f"idea {number}"})

    first_page = pull(client, limit=2)
    second_page = pull(client, since=first_page["cursor"], limit=2)

    assert len(first_page["changes"]) == 2
    assert first_page["has_more"] is True
    assert [change["row"]["text"] for change in second_page["changes"]] == ["idea 2"]
    assert second_page["has_more"] is False


def test_every_write_moves_the_row_forward(client: TestClient) -> None:
    todo = client.post("/api/todos", json={"title": "Draft"}).json()
    cursor = pull(client)["cursor"]

    client.patch(f"/api/todos/{todo['id']}", json={"title": "Renamed"})
    renamed = pull(client, since=cursor)
    client.delete(f"/api/todos/{todo['id']}")
    deleted = pull(client, since=renamed["cursor"])

    assert [change["row"]["title"] for change in renamed["changes"]] == ["Renamed"]
    assert deleted["changes"][0]["row"]["deleted_at"] is not None  # deletions sync too


def test_pull_includes_server_written_tables(client: TestClient, db: Session) -> None:
    db.add(TickerMessage(kind=TickerKind.TIP, text="Breathe."))
    db.commit()

    assert [change["table"] for change in pull(client)["changes"]] == ["ticker_messages"]


# --- Push -----------------------------------------------------------------------------------


def test_push_creates_rows_with_device_ids(client: TestClient) -> None:
    row = todo_row("Written offline")

    result = push(client, ("todos", row))

    assert result == {"applied": [row["id"]], "skipped": [], "rejected": []}
    assert client.get(f"/api/todos/{row['id']}").json()["title"] == "Written offline"


def test_most_recent_edit_wins(client: TestClient) -> None:
    row = todo_row("Original", minutes_ago=10)
    push(client, ("todos", row))

    newer = {**row, "title": "Newer", "updated_at": timestamp(minutes_ago=5)}
    older = {**row, "title": "Older", "updated_at": timestamp(minutes_ago=8)}

    assert push(client, ("todos", newer))["applied"] == [row["id"]]
    assert push(client, ("todos", older))["skipped"] == [row["id"]]
    assert client.get(f"/api/todos/{row['id']}").json()["title"] == "Newer"


def test_a_device_clock_in_the_future_is_brought_back(client: TestClient) -> None:
    row = todo_row("From the future", updated_at=timestamp(minutes_ago=-60 * 24))
    push(client, ("todos", row))

    stored = client.get(f"/api/todos/{row['id']}").json()

    stored_at = datetime.fromisoformat(stored["updated_at"])
    assert stored_at <= datetime.now(UTC)


def test_linked_rows_are_applied_in_dependency_order(client: TestClient) -> None:
    now = timestamp()
    north_star = {"id": str(uuid.uuid4()), "title": "Novel", "created_at": now, "updated_at": now}
    milestone = {
        "id": str(uuid.uuid4()),
        "north_star_id": north_star["id"],
        "title": "Draft",
        "created_at": now,
        "updated_at": now,
    }
    todo = todo_row("Outline", milestone_id=milestone["id"])

    # Sent in the "wrong" order: the todo before the milestone it links to.
    result = push(client, ("todos", todo), ("milestones", milestone), ("north_stars", north_star))

    assert sorted(result["applied"]) == sorted([north_star["id"], milestone["id"], todo["id"]])


def test_bad_changes_are_rejected_without_blocking_others(client: TestClient) -> None:
    good = todo_row("Good")
    invalid = todo_row("   ")  # empty title
    broken_link = todo_row("Linked", milestone_id=str(uuid.uuid4()))
    read_only = {"id": str(uuid.uuid4()), "kind": "tip", "text": "x"}

    result = push(
        client,
        ("todos", good),
        ("todos", invalid),
        ("todos", broken_link),
        ("ticker_messages", read_only),
        ("unknown_table", {"id": "x"}),
    )

    assert result["applied"] == [good["id"]]
    reasons = {(rejected["table"], rejected["reason"]) for rejected in result["rejected"]}
    assert reasons == {
        ("todos", "invalid row"),
        ("todos", "invalid reference or value"),
        ("ticker_messages", "unknown or read-only table"),
        ("unknown_table", "unknown or read-only table"),
    }


def test_server_owned_fields_are_ignored(client: TestClient, db: Session) -> None:
    reminder_id = str(uuid.uuid4())
    row = {
        "id": reminder_id,
        "text": "Send the budget",
        "remind_at": timestamp(minutes_ago=-60),
        "sent_at": timestamp(),  # only the server sets this
        "revision": 999,
        "created_at": timestamp(),
        "updated_at": timestamp(),
    }

    assert push(client, ("reminders", row))["applied"] == [reminder_id]
    reminder = db.get(Reminder, uuid.UUID(reminder_id))
    assert reminder is not None
    assert reminder.sent_at is None
    assert reminder.revision != 999


def test_pushed_changes_come_back_on_pull(client: TestClient) -> None:
    row = todo_row("Round trip")
    push(client, ("todos", row))

    pulled_ids = [change["row"]["id"] for change in pull(client)["changes"]]

    assert pulled_ids == [row["id"]]


def test_push_is_limited_in_size(client: TestClient) -> None:
    changes = [{"table": "ideas", "row": {}} for _ in range(501)]

    assert client.post("/api/sync/push", json={"changes": changes}).status_code == 422
