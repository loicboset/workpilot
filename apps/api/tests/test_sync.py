"""Sync: pull by revision, push with "most recent edit wins" (ADR 0025), rows kept in their
space (ADR 0031)."""

import uuid
from datetime import UTC, datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.db.base import Base, SyncedMixin
from app.db.enums import TickerKind
from app.db.models import AISettings, Reminder, Space, TickerMessage, Todo
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


def space_row(name: str, **fields: object) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "slug": name.lower(),
        "created_at": timestamp(),
        "updated_at": timestamp(),
        **fields,
    }


@pytest.fixture
def space_id(space: Space) -> str:
    return str(space.id)


@pytest.fixture
def cursor(client: TestClient, space: Space) -> int:
    """Where a device that already has the space would pull from."""
    return pull(client)["cursor"]


def test_every_synced_model_is_registered() -> None:
    synced_models = {
        mapper.class_ for mapper in Base.registry.mappers if issubclass(mapper.class_, SyncedMixin)
    }
    assert synced_models == {table.model for table in SYNCED_TABLES}


# --- Pull -----------------------------------------------------------------------------------


def test_pull_returns_changes_in_order_with_a_cursor(
    client: TestClient, in_space: str, cursor: int
) -> None:
    client.post(f"{in_space}/ideas", json={"text": "first"})
    client.post(f"{in_space}/todos", json={"title": "second"})

    result = pull(client, since=cursor)

    assert [change["table"] for change in result["changes"]] == ["ideas", "todos"]
    assert result["changes"][0]["row"]["text"] == "first"
    assert result["changes"][1]["row"]["title"] == "second"
    assert result["has_more"] is False
    assert pull(client, since=result["cursor"])["changes"] == []


def test_pull_starts_with_the_spaces(client: TestClient, in_space: str) -> None:
    client.post(f"{in_space}/ideas", json={"text": "first"})

    changes = pull(client)["changes"]

    assert [change["table"] for change in changes] == ["spaces", "ideas"]
    assert changes[0]["row"]["slug"] == "personal"
    assert changes[1]["row"]["space_id"] == changes[0]["row"]["id"]


def test_pull_pages_with_limit(client: TestClient, in_space: str, cursor: int) -> None:
    for number in range(3):
        client.post(f"{in_space}/ideas", json={"text": f"idea {number}"})

    first_page = pull(client, since=cursor, limit=2)
    second_page = pull(client, since=first_page["cursor"], limit=2)

    assert len(first_page["changes"]) == 2
    assert first_page["has_more"] is True
    assert [change["row"]["text"] for change in second_page["changes"]] == ["idea 2"]
    assert second_page["has_more"] is False


def test_every_write_moves_the_row_forward(client: TestClient, in_space: str) -> None:
    todo = client.post(f"{in_space}/todos", json={"title": "Draft"}).json()
    cursor = pull(client)["cursor"]

    client.patch(f"{in_space}/todos/{todo['id']}", json={"title": "Renamed"})
    renamed = pull(client, since=cursor)
    client.delete(f"{in_space}/todos/{todo['id']}")
    deleted = pull(client, since=renamed["cursor"])

    assert [change["row"]["title"] for change in renamed["changes"]] == ["Renamed"]
    assert deleted["changes"][0]["row"]["deleted_at"] is not None  # deletions sync too


def test_pull_includes_server_written_tables(
    client: TestClient, db: Session, space: Space, cursor: int
) -> None:
    db.add(TickerMessage(space_id=space.id, kind=TickerKind.TIP, text="Breathe."))
    db.commit()

    changes = pull(client, since=cursor)["changes"]

    assert [change["table"] for change in changes] == ["ticker_messages"]


# --- Push -----------------------------------------------------------------------------------


def test_push_creates_rows_with_device_ids(
    client: TestClient, in_space: str, space_id: str
) -> None:
    row = todo_row("Written offline", space_id=space_id)

    result = push(client, ("todos", row))

    assert result == {"applied": [row["id"]], "skipped": [], "rejected": []}
    assert client.get(f"{in_space}/todos/{row['id']}").json()["title"] == "Written offline"


def test_most_recent_edit_wins(client: TestClient, in_space: str, space_id: str) -> None:
    row = todo_row("Original", minutes_ago=10, space_id=space_id)
    push(client, ("todos", row))

    newer = {**row, "title": "Newer", "updated_at": timestamp(minutes_ago=5)}
    older = {**row, "title": "Older", "updated_at": timestamp(minutes_ago=8)}

    assert push(client, ("todos", newer))["applied"] == [row["id"]]
    assert push(client, ("todos", older))["skipped"] == [row["id"]]
    assert client.get(f"{in_space}/todos/{row['id']}").json()["title"] == "Newer"


def test_a_device_clock_in_the_future_is_brought_back(
    client: TestClient, in_space: str, space_id: str
) -> None:
    row = todo_row("From the future", updated_at=timestamp(minutes_ago=-60 * 24), space_id=space_id)
    push(client, ("todos", row))

    stored = client.get(f"{in_space}/todos/{row['id']}").json()

    stored_at = datetime.fromisoformat(stored["updated_at"])
    assert stored_at <= datetime.now(UTC)


def test_linked_rows_are_applied_in_dependency_order(client: TestClient) -> None:
    now = timestamp()
    space = space_row("Work")
    north_star = {
        "id": str(uuid.uuid4()),
        "space_id": space["id"],
        "title": "Novel",
        "created_at": now,
        "updated_at": now,
    }
    milestone = {
        "id": str(uuid.uuid4()),
        "space_id": space["id"],
        "north_star_id": north_star["id"],
        "title": "Draft",
        "created_at": now,
        "updated_at": now,
    }
    todo = todo_row("Outline", milestone_id=milestone["id"], space_id=space["id"])

    # Sent in the "wrong" order: the todo before the milestone it links to, the space last.
    result = push(
        client,
        ("todos", todo),
        ("milestones", milestone),
        ("north_stars", north_star),
        ("spaces", space),
    )

    assert sorted(result["applied"]) == sorted(
        [space["id"], north_star["id"], milestone["id"], todo["id"]]
    )


def test_bad_changes_are_rejected_without_blocking_others(
    client: TestClient, space_id: str
) -> None:
    good = todo_row("Good", space_id=space_id)
    invalid = todo_row("   ", space_id=space_id)  # empty title
    broken_link = todo_row("Linked", milestone_id=str(uuid.uuid4()), space_id=space_id)
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


def test_server_owned_fields_are_ignored(client: TestClient, db: Session, space_id: str) -> None:
    reminder_id = str(uuid.uuid4())
    row = {
        "id": reminder_id,
        "space_id": space_id,
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


def test_pushed_changes_come_back_on_pull(client: TestClient, space_id: str, cursor: int) -> None:
    row = todo_row("Round trip", space_id=space_id)
    push(client, ("todos", row))

    pulled_ids = [change["row"]["id"] for change in pull(client, since=cursor)["changes"]]

    assert pulled_ids == [row["id"]]


def test_push_is_limited_in_size(client: TestClient) -> None:
    changes = [{"table": "ideas", "row": {}} for _ in range(501)]

    assert client.post("/api/sync/push", json={"changes": changes}).status_code == 422


# --- Spaces (ADR 0031) ----------------------------------------------------------------------


def test_a_row_never_changes_space(client: TestClient, db: Session, space_id: str) -> None:
    work = space_row("Work")
    push(client, ("spaces", work))
    row = todo_row("Mine", minutes_ago=5, space_id=space_id)
    push(client, ("todos", row))

    moved = {**row, "space_id": work["id"], "updated_at": timestamp()}
    result = push(client, ("todos", moved))

    assert result["rejected"] == [
        {"table": "todos", "id": row["id"], "reason": "a row never changes space"}
    ]
    todo = db.get(Todo, uuid.UUID(row["id"]))
    assert todo is not None
    assert str(todo.space_id) == space_id


def test_a_link_to_another_space_is_refused(
    client: TestClient, space_id: str, milestone_id: str
) -> None:
    work = space_row("Work")
    push(client, ("spaces", work))

    result = push(
        client, ("todos", todo_row("Linked", milestone_id=milestone_id, space_id=work["id"]))
    )

    assert [rejected["reason"] for rejected in result["rejected"]] == ["invalid reference or value"]


def test_a_row_from_before_spaces_keeps_its_space_or_goes_to_the_first(
    client: TestClient, db: Session, space: Space
) -> None:
    push(client, ("spaces", space_row("Work")))  # newer than `space`
    existing = todo_row("Existing", minutes_ago=5, space_id=str(space.id))
    push(client, ("todos", existing))

    # A device from before spaces sends rows without one.
    edited = {key: value for key, value in existing.items() if key != "space_id"}
    new = todo_row("New")
    result = push(client, ("todos", {**edited, "updated_at": timestamp()}), ("todos", new))

    assert sorted(result["applied"]) == sorted([existing["id"], new["id"]])
    for row_id in (existing["id"], new["id"]):
        todo = db.get(Todo, uuid.UUID(row_id))
        assert todo is not None
        assert todo.space_id == space.id  # the first space


def test_a_row_without_a_space_needs_one_to_exist(client: TestClient) -> None:
    result = push(client, ("todos", todo_row("Nowhere")))

    assert result["rejected"][0]["reason"] == "no space yet"


def test_a_space_needs_a_url_name_the_app_doesnt_use(client: TestClient) -> None:
    result = push(client, ("spaces", space_row("Work", slug="sign-in")))

    assert result["rejected"][0]["reason"] == "invalid row"


def test_a_new_space_starts_with_the_ai_settings_it_was_created_from(
    client: TestClient, db: Session, space: Space, in_space: str
) -> None:
    client.patch(f"{in_space}/ai/settings", json={"provider": "anthropic", "api_key": "sk-home"})
    work = space_row("Work", copy_ai_from=str(space.id))

    push(client, ("spaces", work))
    push(client, ("spaces", {**work, "name": "Work stuff", "updated_at": timestamp()}))

    copied = db.get(AISettings, uuid.UUID(work["id"]))
    assert copied is not None
    assert copied.provider == "anthropic"
    pulled = [change["row"] for change in pull(client)["changes"] if change["table"] == "spaces"]
    assert "copy_ai_from" not in pulled[-1]  # not a column
