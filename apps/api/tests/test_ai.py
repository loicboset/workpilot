"""AI settings and prompts."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.ai.default_prompts import default_prompts
from app.crypto import decrypt
from app.db.models import AISettings


def test_settings_are_empty_at_first(client: TestClient) -> None:
    assert client.get("/api/ai/settings").json() == {
        "provider": None,
        "base_url": None,
        "model": None,
        "has_api_key": False,
    }


def test_api_key_is_stored_encrypted_and_never_returned(client: TestClient, db: Session) -> None:
    response = client.patch(
        "/api/ai/settings",
        json={"provider": "anthropic", "model": "a-model", "api_key": "sk-secret"},
    )

    assert response.status_code == 200
    assert response.json()["has_api_key"] is True
    assert "sk-secret" not in response.text
    stored = db.get(AISettings, 1)
    assert stored is not None
    assert stored.api_key_encrypted != "sk-secret"
    assert decrypt(stored.api_key_encrypted) == "sk-secret"


def test_partial_update_keeps_the_key_and_null_removes_it(client: TestClient) -> None:
    client.patch("/api/ai/settings", json={"api_key": "sk-secret"})

    kept = client.patch("/api/ai/settings", json={"model": "another-model"}).json()
    removed = client.patch("/api/ai/settings", json={"api_key": None}).json()

    assert kept["has_api_key"] is True
    assert removed["has_api_key"] is False
    assert removed["model"] == "another-model"


def test_prompt_default_edit_and_reset(client: TestClient) -> None:
    default = client.get("/api/ai/prompts/ticker").json()
    assert default == {"key": "ticker", "body": default_prompts()["ticker"], "is_default": True}

    edited = client.put("/api/ai/prompts/ticker", json={"body": "Be brief."}).json()
    assert edited == {"key": "ticker", "body": "Be brief.", "is_default": False}

    assert client.delete("/api/ai/prompts/ticker").status_code == 204
    assert client.get("/api/ai/prompts/ticker").json() == default


def test_prompts_list_and_unknown_key(client: TestClient) -> None:
    keys = [prompt["key"] for prompt in client.get("/api/ai/prompts").json()]

    assert keys == ["ticker"]
    assert client.get("/api/ai/prompts/unknown").status_code == 404
    assert client.put("/api/ai/prompts/unknown", json={"body": "x"}).status_code == 404
