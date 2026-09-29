import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.config import Settings
from tests.credentials import TEST_PASSWORD, TEST_USERNAME


def login(client: TestClient, password: str = TEST_PASSWORD) -> int:
    response = client.post(
        "/api/auth/login", json={"username": TEST_USERNAME, "password": password}
    )
    return response.status_code


def test_routes_require_login(anonymous_client: TestClient) -> None:
    assert anonymous_client.get("/api/todos").status_code == 401
    assert anonymous_client.get("/api/auth/me").status_code == 401
    assert anonymous_client.get("/api/health").status_code == 200  # public


def test_login_then_logout(anonymous_client: TestClient) -> None:
    assert login(anonymous_client) == 204
    assert anonymous_client.get("/api/auth/me").json() == {"username": TEST_USERNAME}
    assert anonymous_client.get("/api/todos").status_code == 200

    assert anonymous_client.post("/api/auth/logout").status_code == 204
    assert anonymous_client.get("/api/todos").status_code == 401


def test_session_cookie_is_http_only(anonymous_client: TestClient) -> None:
    response = anonymous_client.post(
        "/api/auth/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
    )
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert "samesite=lax" in cookie


def test_wrong_password_is_rejected(anonymous_client: TestClient) -> None:
    assert login(anonymous_client, password="wrong") == 401
    assert anonymous_client.get("/api/todos").status_code == 401


def test_too_many_failures_are_throttled(anonymous_client: TestClient) -> None:
    for _ in range(5):
        assert login(anonymous_client, password="wrong") == 401

    # Even the right password is refused while blocked.
    assert login(anonymous_client) == 429


# --- Configuration --------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("user", "secret_key", "message"),
    [
        ("me:change-me", "a" * 40, "Choose your own password"),
        ("", "a" * 40, "Set WORKPILOT_USER"),
        ("me:my-own-password", "change-me", "at least 32 random characters"),
        ("me:my-own-password", "too-short", "at least 32 random characters"),
    ],
    ids=["placeholder-password", "no-user", "placeholder-secret", "short-secret"],
)
def test_refuses_to_start_with_placeholder_login_or_secret(
    user: str, secret_key: str, message: str
) -> None:
    with pytest.raises(ValidationError, match=message):
        Settings(user=user, secret_key=secret_key)
