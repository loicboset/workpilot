from fastapi.testclient import TestClient


def create_block(client: TestClient, title: str, start: str, end: str) -> dict:
    response = client.post(
        "/api/time-blocks", json={"title": title, "start_at": start, "end_at": end}
    )
    assert response.status_code == 201
    return response.json()


def test_list_a_day_in_start_order(client: TestClient) -> None:
    create_block(client, "Afternoon", "2026-10-01T14:00:00+02:00", "2026-10-01T15:00:00+02:00")
    create_block(client, "Deep work", "2026-10-01T09:00:00+02:00", "2026-10-01T11:00:00+02:00")
    create_block(client, "Next day", "2026-10-02T09:00:00+02:00", "2026-10-02T10:00:00+02:00")

    day = client.get(
        "/api/time-blocks",
        params={"start_from": "2026-10-01T00:00:00+02:00", "start_to": "2026-10-01T23:59:59+02:00"},
    ).json()

    assert [block["title"] for block in day] == ["Deep work", "Afternoon"]
    assert day[0]["start_at"] == "2026-10-01T07:00:00Z"  # stored in UTC


def test_end_must_be_after_start(client: TestClient) -> None:
    response = client.post(
        "/api/time-blocks",
        json={
            "title": "Backwards",
            "start_at": "2026-10-01T10:00:00Z",
            "end_at": "2026-10-01T09:00:00Z",
        },
    )
    assert response.status_code == 422


def test_postpone_by_moving_the_slot(client: TestClient) -> None:
    block = create_block(client, "Deep work", "2026-10-01T09:00:00Z", "2026-10-01T11:00:00Z")

    moved = client.patch(
        f"/api/time-blocks/{block['id']}",
        json={"start_at": "2026-10-02T09:00:00Z", "end_at": "2026-10-02T11:00:00Z"},
    )

    assert moved.status_code == 200
    assert moved.json()["start_at"] == "2026-10-02T09:00:00Z"


def test_moving_the_end_before_the_start_is_rejected(client: TestClient) -> None:
    block = create_block(client, "Deep work", "2026-10-01T09:00:00Z", "2026-10-01T11:00:00Z")

    response = client.patch(
        f"/api/time-blocks/{block['id']}", json={"end_at": "2026-10-01T08:00:00Z"}
    )

    assert response.status_code == 422
