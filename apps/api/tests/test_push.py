from fastapi.testclient import TestClient

ENDPOINT = "https://push.example.com/send/abc123"


def subscribe(client: TestClient, auth_key: str = "auth-1") -> dict:
    response = client.post(
        "/api/push/subscriptions",
        json={
            "endpoint": ENDPOINT,
            "expirationTime": None,  # sent by browsers, ignored
            "keys": {"p256dh": "p256dh-key", "auth": auth_key},
            "device_name": "Phone",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_subscribe_again_updates_the_same_device(client: TestClient) -> None:
    first = subscribe(client)
    second = subscribe(client, auth_key="auth-2")

    assert second["id"] == first["id"]
    assert second["endpoint"] == ENDPOINT


def test_endpoint_must_be_https(client: TestClient) -> None:
    response = client.post(
        "/api/push/subscriptions",
        json={"endpoint": "http://insecure.example.com", "keys": {"p256dh": "k", "auth": "a"}},
    )
    assert response.status_code == 422


def test_unsubscribe(client: TestClient) -> None:
    subscribe(client)

    assert (
        client.delete("/api/push/subscriptions", params={"endpoint": ENDPOINT}).status_code == 204
    )
    assert (
        client.delete("/api/push/subscriptions", params={"endpoint": ENDPOINT}).status_code == 404
    )
