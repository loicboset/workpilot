"""REST routes for a space's AI settings, models and prompts. Server only: never synced."""

import uuid

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.default_prompts import default_prompts
from app.ai.schemas import (
    AISettingsRead,
    AISettingsTry,
    AISettingsUpdate,
    PromptRead,
    PromptWrite,
)
from app.ai.service import ProviderDep, make_provider, stored_api_key
from app.crypto import encrypt
from app.db.models import AISettings, Prompt
from app.db.session import SessionDep
from app.domain.spaces.current import CurrentSpace

# Under /api/spaces/{space_id} (see main.py).
router = APIRouter(prefix="/ai", tags=["ai"])


# --- Settings ------------------------------------------------------------------------------


@router.get("/settings", response_model=AISettingsRead)
def get_ai_settings(session: SessionDep, space: CurrentSpace) -> AISettingsRead:
    return _settings_read(session.get(AISettings, space.id))


@router.patch("/settings", response_model=AISettingsRead)
def update_ai_settings(
    data: AISettingsUpdate, session: SessionDep, space: CurrentSpace
) -> AISettingsRead:
    ai_settings = session.get(AISettings, space.id) or AISettings(space_id=space.id)
    changes = data.changes()
    if "api_key" in changes:
        api_key = changes.pop("api_key")
        ai_settings.api_key_encrypted = encrypt(api_key) if api_key else None
    for field, value in changes.items():
        setattr(ai_settings, field, value)
    session.add(ai_settings)
    session.commit()
    return _settings_read(ai_settings)


def _settings_read(ai_settings: AISettings | None) -> AISettingsRead:
    if ai_settings is None:
        return AISettingsRead(provider=None, base_url=None, model=None, has_api_key=False)
    return AISettingsRead(
        provider=ai_settings.provider,
        base_url=ai_settings.base_url,
        model=ai_settings.model,
        has_api_key=ai_settings.api_key_encrypted is not None,
    )


# --- Models --------------------------------------------------------------------------------


@router.get("/models", response_model=list[str])
def list_models(provider: ProviderDep) -> list[str]:
    """The models the configured provider offers. Also tests its URL and key."""
    return provider.list_models()


@router.post("/models/try", response_model=list[str])
def try_settings(data: AISettingsTry, session: SessionDep, space: CurrentSpace) -> list[str]:
    """The models these settings offer, without saving them: tests the URL and the key."""
    provider = make_provider(
        data.provider,
        base_url=data.base_url,
        model=None,
        api_key=data.api_key or stored_api_key(session, space.id),
    )
    return provider.list_models()


# --- Prompts -------------------------------------------------------------------------------


@router.get("/prompts", response_model=list[PromptRead])
def list_prompts(session: SessionDep, space: CurrentSpace) -> list[PromptRead]:
    return [_prompt_read(session, space.id, key) for key in default_prompts()]


@router.get("/prompts/{key}", response_model=PromptRead)
def get_prompt(key: str, session: SessionDep, space: CurrentSpace) -> PromptRead:
    _ensure_known(key)
    return _prompt_read(session, space.id, key)


@router.put("/prompts/{key}", response_model=PromptRead)
def edit_prompt(
    key: str, data: PromptWrite, session: SessionDep, space: CurrentSpace
) -> PromptRead:
    _ensure_known(key)
    prompt = session.get(Prompt, (space.id, key)) or Prompt(space_id=space.id, key=key)
    prompt.body = data.body
    session.add(prompt)
    session.commit()
    return _prompt_read(session, space.id, key)


@router.delete("/prompts/{key}", status_code=status.HTTP_204_NO_CONTENT)
def reset_prompt(key: str, session: SessionDep, space: CurrentSpace) -> None:
    """Go back to the default text."""
    _ensure_known(key)
    edited = session.get(Prompt, (space.id, key))
    if edited is not None:
        session.delete(edited)
        session.commit()


def _ensure_known(key: str) -> None:
    if key not in default_prompts():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")


def _prompt_read(session: Session, space_id: uuid.UUID, key: str) -> PromptRead:
    edited = session.get(Prompt, (space_id, key))
    if edited is None:
        return PromptRead(key=key, body=default_prompts()[key], is_default=True)
    return PromptRead(key=key, body=edited.body, is_default=False)
