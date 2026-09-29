"""AI settings, models and prompts."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.ai.default_prompts import default_prompts
from app.ai.service import configured_provider
from app.crypto import decrypt
from app.db.models import AISettings, Space
from app.main import app


def test_settings_are_empty_at_first(client: TestClient, in_space: str) -> None:
    assert client.get(f"{in_space}/ai/settings").json() == {
        "provider": None,
        "base_url": None,
        "model": None,
        "has_api_key": False,
    }


def test_api_key_is_stored_encrypted_and_never_returned(
    client: TestClient, db: Session, space: Space, in_space: str
) -> None:
    response = client.patch(
        f"{in_space}/ai/settings",
        json={"provider": "anthropic", "model": "a-model", "api_key": "sk-secret"},
    )

    assert response.status_code == 200
    assert response.json()["has_api_key"] is True
    assert "sk-secret" not in response.text
    stored = db.get(AISettings, space.id)
    assert stored is not None
    assert stored.api_key_encrypted != "sk-secret"
    assert decrypt(stored.api_key_encrypted) == "sk-secret"


def test_partial_update_keeps_the_key_and_null_removes_it(
    client: TestClient, in_space: str
) -> None:
    client.patch(f"{in_space}/ai/settings", json={"api_key": "sk-secret"})

    kept = client.patch(f"{in_space}/ai/settings", json={"model": "another-model"}).json()
    removed = client.patch(f"{in_space}/ai/settings", json={"api_key": None}).json()

    assert kept["has_api_key"] is True
    assert removed["has_api_key"] is False
    assert removed["model"] == "another-model"


def test_each_space_has_its_own_settings_and_prompts(
    client: TestClient, db: Session, in_space: str
) -> None:
    work = Space(name="Work", slug="work")
    db.add(work)
    db.commit()
    client.patch(f"{in_space}/ai/settings", json={"provider": "anthropic", "api_key": "sk-home"})
    client.put(f"{in_space}/ai/prompts/ticker", json={"body": "Be brief."})

    assert client.get(f"/api/spaces/{work.id}/ai/settings").json()["provider"] is None
    assert client.get(f"/api/spaces/{work.id}/ai/prompts/ticker").json()["is_default"] is True


def test_a_new_space_can_start_with_another_spaces_ai(client: TestClient, in_space: str) -> None:
    client.patch(
        f"{in_space}/ai/settings",
        json={"provider": "openai_compatible", "base_url": "http://localhost:1234/v1"},
    )
    client.put(f"{in_space}/ai/prompts/ticker", json={"body": "Be brief."})
    home_id = in_space.rsplit("/", 1)[1]

    work = client.post("/api/spaces", json={"name": "Work", "copy_ai_from": home_id}).json()

    copied = client.get(f"/api/spaces/{work['id']}/ai/settings").json()
    assert copied["base_url"] == "http://localhost:1234/v1"
    assert client.get(f"/api/spaces/{work['id']}/ai/prompts/ticker").json()["body"] == "Be brief."


def test_ai_routes_need_an_existing_space(client: TestClient) -> None:
    assert (
        client.get("/api/spaces/00000000-0000-0000-0000-000000000000/ai/settings").status_code
        == 404
    )


def test_prompt_default_edit_and_reset(client: TestClient, in_space: str) -> None:
    default = client.get(f"{in_space}/ai/prompts/ticker").json()
    assert default == {"key": "ticker", "body": default_prompts()["ticker"], "is_default": True}

    edited = client.put(f"{in_space}/ai/prompts/ticker", json={"body": "Be brief."}).json()
    assert edited == {"key": "ticker", "body": "Be brief.", "is_default": False}

    assert client.delete(f"{in_space}/ai/prompts/ticker").status_code == 204
    assert client.get(f"{in_space}/ai/prompts/ticker").json() == default


def test_prompts_list_and_unknown_key(client: TestClient, in_space: str) -> None:
    keys = [prompt["key"] for prompt in client.get(f"{in_space}/ai/prompts").json()]

    assert keys == ["ticker"]
    assert client.get(f"{in_space}/ai/prompts/unknown").status_code == 404
    assert client.put(f"{in_space}/ai/prompts/unknown", json={"body": "x"}).status_code == 404


def test_provider_must_be_a_supported_kind(client: TestClient, in_space: str) -> None:
    response = client.patch(f"{in_space}/ai/settings", json={"provider": "skynet"})

    assert response.status_code == 422


# --- Models ---------------------------------------------------------------------------------


class FakeProvider:
    def generate[Answer: BaseModel](self, prompt: str, answer: type[Answer]) -> Answer:
        raise NotImplementedError

    def list_models(self) -> list[str]:
        return ["gemma-3-12b", "qwen3-8b"]


@pytest.fixture
def fake_provider() -> Iterator[None]:
    app.dependency_overrides[configured_provider] = FakeProvider
    yield
    app.dependency_overrides.clear()


@pytest.mark.usefixtures("fake_provider")
def test_models_come_from_the_configured_provider(client: TestClient, in_space: str) -> None:
    assert client.get(f"{in_space}/ai/models").json() == ["gemma-3-12b", "qwen3-8b"]


@pytest.mark.parametrize(
    "ai_settings",
    [
        {},
        {"provider": "openai_compatible"},  # no base URL
        {"provider": "anthropic", "model": "claude"},  # no API key
    ],
    ids=["nothing", "openai-compatible-without-url", "anthropic-without-key"],
)
def test_models_need_a_configured_provider(
    client: TestClient, ai_settings: dict, in_space: str
) -> None:
    if ai_settings:
        client.patch(f"{in_space}/ai/settings", json=ai_settings)

    response = client.get(f"{in_space}/ai/models")

    assert response.status_code == 409
    assert response.json() == {"detail": "ai_not_configured"}


def test_an_unreachable_provider_is_a_502(client: TestClient, in_space: str) -> None:
    # Nothing listens on port 9, like LM Studio when its server isn't started.
    settings = {"provider": "openai_compatible", "base_url": "http://127.0.0.1:9/v1"}
    client.patch(f"{in_space}/ai/settings", json=settings)

    response = client.get(f"{in_space}/ai/models")

    assert response.status_code == 502
    assert response.json() == {"detail": "ai_unreachable"}


# --- Trying settings before saving them ----------------------------------------------------


@pytest.fixture
def made_with(monkeypatch: pytest.MonkeyPatch) -> dict:
    """What `POST /api/ai/models/try` built its provider from. The provider is a fake."""
    made: dict = {}

    def make_fake(kind: str, **settings: str | None) -> FakeProvider:
        made.update(kind=kind, **settings)
        return FakeProvider()

    monkeypatch.setattr("app.ai.router.make_provider", make_fake)
    return made


def test_trying_settings_lists_the_models_and_saves_nothing(
    client: TestClient, made_with: dict, in_space: str
) -> None:
    settings = {"provider": "openai_compatible", "base_url": "http://localhost:1234/v1"}

    response = client.post(f"{in_space}/ai/models/try", json=settings)

    assert response.json() == ["gemma-3-12b", "qwen3-8b"]
    assert made_with["base_url"] == "http://localhost:1234/v1"
    assert client.get(f"{in_space}/ai/settings").json()["base_url"] is None


def test_trying_settings_uses_the_stored_key_unless_one_is_sent(
    client: TestClient, made_with: dict, in_space: str
) -> None:
    client.patch(f"{in_space}/ai/settings", json={"provider": "anthropic", "api_key": "sk-stored"})

    client.post(f"{in_space}/ai/models/try", json={"provider": "anthropic"})
    assert made_with["api_key"] == "sk-stored"

    client.post(f"{in_space}/ai/models/try", json={"provider": "anthropic", "api_key": "sk-typed"})
    assert made_with["api_key"] == "sk-typed"


def test_trying_incomplete_settings_is_a_409(client: TestClient, in_space: str) -> None:
    response = client.post(f"{in_space}/ai/models/try", json={"provider": "openai_compatible"})

    assert response.status_code == 409
    assert response.json() == {"detail": "ai_not_configured"}


def test_trying_an_unreachable_server_is_a_502(client: TestClient, in_space: str) -> None:
    settings = {"provider": "openai_compatible", "base_url": "http://127.0.0.1:9/v1"}

    response = client.post(f"{in_space}/ai/models/try", json=settings)

    assert response.status_code == 502
    assert response.json() == {"detail": "ai_unreachable"}
