import uuid

from fastapi.testclient import TestClient


def create_north_star(client: TestClient) -> str:
    return client.put("/api/north-star", json={"title": "Finish my first novel"}).json()["id"]


def test_create_and_list_in_position_order(client: TestClient) -> None:
    north_star_id = create_north_star(client)
    for title, position in [("Publish", 2), ("Outline", 0), ("First draft", 1)]:
        response = client.post(
            "/api/milestones",
            json={"north_star_id": north_star_id, "title": title, "position": position},
        )
        assert response.status_code == 201

    titles = [m["title"] for m in client.get("/api/milestones").json()]
    assert titles == ["Outline", "First draft", "Publish"]


def test_create_requires_an_existing_north_star(client: TestClient) -> None:
    response = client.post(
        "/api/milestones", json={"north_star_id": str(uuid.uuid4()), "title": "Outline"}
    )
    assert response.status_code == 422


def test_complete_and_filter(client: TestClient) -> None:
    north_star_id = create_north_star(client)
    milestone = client.post(
        "/api/milestones", json={"north_star_id": north_star_id, "title": "Outline"}
    ).json()

    client.patch(
        f"/api/milestones/{milestone['id']}", json={"completed_at": "2026-10-01T10:00:00Z"}
    )

    assert len(client.get("/api/milestones", params={"completed": True}).json()) == 1
    assert client.get("/api/milestones", params={"completed": False}).json() == []


def test_update_rejects_clearing_required_fields(client: TestClient) -> None:
    north_star_id = create_north_star(client)
    milestone = client.post(
        "/api/milestones", json={"north_star_id": north_star_id, "title": "Outline"}
    ).json()
    url = f"/api/milestones/{milestone['id']}"

    assert client.patch(url, json={"title": None}).status_code == 422
    assert client.patch(url, json={"position": None}).status_code == 422
    assert client.patch(url, json={"position": -1}).status_code == 422
