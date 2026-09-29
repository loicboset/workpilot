import uuid

from fastapi.testclient import TestClient


def create_todo(client: TestClient, **fields: object) -> dict:
    response = client.post("/api/todos", json={"title": "Draft", **fields})
    assert response.status_code == 201
    return response.json()


def test_create_with_only_a_title(client: TestClient) -> None:
    response = client.post("/api/todos", json={"title": "  Call Marc  "})

    assert response.status_code == 201
    todo = response.json()
    assert todo["title"] == "Call Marc"
    assert todo["due_date"] is None
    assert todo["priority"] is None
    assert todo["completed_at"] is None
    assert todo["deleted_at"] is None
    assert todo["created_at"].endswith("Z")
    uuid.UUID(todo["id"])


def test_create_with_client_id_and_milestone(client: TestClient, milestone_id: str) -> None:
    todo_id = str(uuid.uuid4())

    todo = create_todo(client, id=todo_id, due_date="2026-10-01", milestone_id=milestone_id)

    assert todo["id"] == todo_id
    assert todo["milestone_id"] == milestone_id


def test_create_twice_with_same_id_is_a_conflict(client: TestClient) -> None:
    todo_id = str(uuid.uuid4())
    create_todo(client, id=todo_id)

    response = client.post("/api/todos", json={"id": todo_id, "title": "Again"})

    assert response.status_code == 409


def test_create_rejects_invalid_input(client: TestClient) -> None:
    assert client.post("/api/todos", json={"title": "   "}).status_code == 422
    assert client.post("/api/todos", json={}).status_code == 422
    assert client.post("/api/todos", json={"titel": "typo"}).status_code == 422
    unknown_milestone = {"title": "Draft", "milestone_id": str(uuid.uuid4())}
    assert client.post("/api/todos", json=unknown_milestone).status_code == 422


def test_list_is_sorted_and_filtered(client: TestClient) -> None:
    create_todo(client, title="undated")
    create_todo(client, title="late", due_date="2026-10-05")
    early = create_todo(client, title="early", due_date="2026-10-01")
    client.patch(f"/api/todos/{early['id']}", json={"completed_at": "2026-10-01T09:00:00Z"})

    def titles(**params: object) -> list[str]:
        return [todo["title"] for todo in client.get("/api/todos", params=params).json()]

    assert titles() == ["early", "late", "undated"]
    assert titles(due_from="2026-10-02", due_to="2026-10-31") == ["late"]
    assert titles(completed=False) == ["late", "undated"]
    assert titles(completed=True) == ["early"]


def test_within_a_day_higher_priority_comes_first(client: TestClient) -> None:
    for title, priority in [("none", None), ("low", 3), ("high", 1), ("medium", 2)]:
        create_todo(client, title=title, due_date="2026-10-01", priority=priority)

    titles = [todo["title"] for todo in client.get("/api/todos").json()]

    assert titles == ["high", "medium", "low", "none"]


def test_postpone_complete_and_reopen(client: TestClient) -> None:
    todo = create_todo(client, due_date="2026-10-01")
    url = f"/api/todos/{todo['id']}"

    postponed = client.patch(url, json={"due_date": "2026-10-03"}).json()
    assert postponed["due_date"] == "2026-10-03"
    assert postponed["updated_at"] >= todo["updated_at"]

    completed = client.patch(url, json={"completed_at": "2026-10-03T17:30:00+02:00"}).json()
    assert completed["completed_at"] == "2026-10-03T15:30:00Z"  # stored in UTC

    reopened = client.patch(url, json={"due_date": None, "completed_at": None}).json()
    assert reopened["due_date"] is None
    assert reopened["completed_at"] is None


def test_set_and_clear_priority(client: TestClient) -> None:
    todo = create_todo(client, priority=2)
    url = f"/api/todos/{todo['id']}"
    assert todo["priority"] == 2

    assert client.patch(url, json={"priority": 1}).json()["priority"] == 1
    assert client.patch(url, json={"priority": None}).json()["priority"] is None


def test_update_rejects_invalid_input(client: TestClient) -> None:
    todo = create_todo(client)
    url = f"/api/todos/{todo['id']}"

    assert client.patch(url, json={"title": None}).status_code == 422
    assert client.patch(url, json={"completed_at": "2026-10-03T17:30:00"}).status_code == 422
    assert client.patch(url, json={"milestone_id": str(uuid.uuid4())}).status_code == 422
    assert client.patch(url, json={"priority": 0}).status_code == 422
    assert client.patch(url, json={"priority": 4}).status_code == 422
    # The failed updates left the todo unchanged.
    assert client.get(url).json() == todo


def test_soft_delete(client: TestClient) -> None:
    todo = create_todo(client)
    url = f"/api/todos/{todo['id']}"

    response = client.delete(url)
    assert response.status_code == 204
    assert response.content == b""

    assert client.get(url).status_code == 404
    assert client.delete(url).status_code == 404
    assert client.get("/api/todos").json() == []
    deleted = client.get("/api/todos", params={"include_deleted": True}).json()
    assert [row["id"] for row in deleted] == [todo["id"]]
    assert deleted[0]["deleted_at"] is not None


def test_unknown_or_malformed_id(client: TestClient) -> None:
    assert client.get(f"/api/todos/{uuid.uuid4()}").status_code == 404
    assert client.get("/api/todos/not-a-uuid").status_code == 422
