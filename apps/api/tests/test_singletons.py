"""The one-row resources: profile and North Star."""

from fastapi.testclient import TestClient


def test_profile_does_not_exist_before_onboarding(client: TestClient) -> None:
    assert client.get("/api/profile").status_code == 404


def test_profile_put_creates_then_replaces(client: TestClient) -> None:
    created = client.put(
        "/api/profile",
        json={"first_name": "Loïc", "locale": "fr", "timezone": "Europe/Zurich", "city": "Zurich"},
    )
    assert created.status_code == 200
    assert created.json()["timezone"] == "Europe/Zurich"

    replaced = client.put("/api/profile", json={"first_name": "Loïc", "last_name": "B."}).json()
    assert replaced["id"] == created.json()["id"]  # still the same profile
    assert replaced["last_name"] == "B."
    assert replaced["city"] is None  # PUT replaces every field
    assert replaced["locale"] == "en"
    assert replaced["theme"] == "system"  # the device's setting
    assert replaced["palette"] == "grove"

    dark = client.put(
        "/api/profile", json={"first_name": "Loïc", "theme": "dark", "palette": "heather"}
    ).json()
    assert dark["theme"] == "dark"
    assert dark["palette"] == "heather"

    assert client.get("/api/profile").json() == dark


def test_profile_rejects_invalid_values(client: TestClient) -> None:
    assert (
        client.put("/api/profile", json={"first_name": "A", "timezone": "Mars/Base"}).status_code
        == 422
    )
    assert client.put("/api/profile", json={"first_name": "A", "locale": "de"}).status_code == 422
    assert client.put("/api/profile", json={"first_name": "A", "theme": "sepia"}).status_code == 422
    assert client.put("/api/profile", json={"first_name": "A", "palette": "red"}).status_code == 422
    assert client.put("/api/profile", json={"first_name": " "}).status_code == 422


def test_north_star_put_and_get(client: TestClient) -> None:
    assert client.get("/api/north-star").status_code == 404

    body = {"title": "Finish my first novel", "description": "Calmly.", "target_date": "2027-06-30"}
    north_star = client.put("/api/north-star", json=body).json()

    assert north_star["title"] == "Finish my first novel"
    assert client.get("/api/north-star").json() == north_star
