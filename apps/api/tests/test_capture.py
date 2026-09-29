"""Ideas and notes."""

from fastapi.testclient import TestClient


def test_ideas_are_listed_newest_first(client: TestClient, in_space: str) -> None:
    for text in ["first", "second", "third"]:
        assert client.post(f"{in_space}/ideas", json={"text": text}).status_code == 201

    texts = [idea["text"] for idea in client.get(f"{in_space}/ideas").json()]

    assert texts == ["third", "second", "first"]


def test_idea_text_is_required(client: TestClient, in_space: str) -> None:
    assert client.post(f"{in_space}/ideas", json={"text": "  "}).status_code == 422


def test_note_with_milestone_link_and_filter(
    client: TestClient, milestone_id: str, in_space: str
) -> None:
    client.post(f"{in_space}/notes", json={"content": "Unlinked"})
    linked = client.post(
        f"{in_space}/notes",
        json={
            "title": "Takeaways",
            "content": "Keep chapters short.",
            "milestone_id": milestone_id,
        },
    )
    assert linked.status_code == 201

    notes = client.get(f"{in_space}/notes", params={"milestone_id": milestone_id}).json()

    assert [note["title"] for note in notes] == ["Takeaways"]


def test_note_content_cannot_be_cleared(client: TestClient, in_space: str) -> None:
    note = client.post(f"{in_space}/notes", json={"content": "Keep"}).json()

    assert client.patch(f"{in_space}/notes/{note['id']}", json={"content": None}).status_code == 422
