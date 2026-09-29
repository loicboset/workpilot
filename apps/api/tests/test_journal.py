"""Journal entries and review templates."""

from fastapi.testclient import TestClient


def create_template(client: TestClient, in_space: str) -> dict:
    response = client.post(
        f"{in_space}/review-templates",
        json={
            "name": "Weekly review",
            "kind": "weekly",
            "questions": ["What went well?", "What will I adjust?"],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_template_questions_round_trip(client: TestClient, in_space: str) -> None:
    template = create_template(client, in_space)

    assert template["questions"] == ["What went well?", "What will I adjust?"]
    assert client.get(f"{in_space}/review-templates", params={"kind": "daily"}).json() == []


def test_template_needs_at_least_one_question(client: TestClient, in_space: str) -> None:
    response = client.post(
        f"{in_space}/review-templates", json={"name": "Empty", "kind": "daily", "questions": []}
    )
    assert response.status_code == 422


def test_free_entry_defaults(client: TestClient, in_space: str) -> None:
    entry = client.post(f"{in_space}/journal-entries", json={"entry_date": "2026-10-01"}).json()

    assert entry["kind"] == "free"
    assert entry["content"] == ""


def test_guided_review_entry_and_filters(client: TestClient, in_space: str) -> None:
    template = create_template(client, in_space)
    client.post(f"{in_space}/journal-entries", json={"entry_date": "2026-09-20", "content": "Old"})
    client.post(
        f"{in_space}/journal-entries",
        json={
            "entry_date": "2026-10-02",
            "kind": "weekly",
            "content": "## What went well?\nThe outline.",
            "review_template_id": template["id"],
        },
    )

    october = client.get(f"{in_space}/journal-entries", params={"entry_from": "2026-10-01"}).json()
    weekly = client.get(f"{in_space}/journal-entries", params={"kind": "weekly"}).json()

    assert [entry["entry_date"] for entry in october] == ["2026-10-02"]
    assert weekly[0]["review_template_id"] == template["id"]
