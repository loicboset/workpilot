"""REST routes for AI settings and prompts. Server only: never synced to the browser."""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.ai.default_prompts import default_prompts
from app.ai.schemas import AISettingsRead, AISettingsUpdate, PromptRead, PromptWrite
from app.crypto import encrypt
from app.db.models import AISettings, Prompt
from app.db.session import SessionDep

router = APIRouter(prefix="/api/ai", tags=["ai"])

AI_SETTINGS_ID = 1  # the table holds a single row


# --- Settings ------------------------------------------------------------------------------


@router.get("/settings", response_model=AISettingsRead)
def get_ai_settings(session: SessionDep) -> AISettingsRead:
    return _settings_read(session.get(AISettings, AI_SETTINGS_ID))


@router.patch("/settings", response_model=AISettingsRead)
def update_ai_settings(data: AISettingsUpdate, session: SessionDep) -> AISettingsRead:
    ai_settings = session.get(AISettings, AI_SETTINGS_ID) or AISettings(id=AI_SETTINGS_ID)
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


# --- Prompts -------------------------------------------------------------------------------


@router.get("/prompts", response_model=list[PromptRead])
def list_prompts(session: SessionDep) -> list[PromptRead]:
    return [_prompt_read(session, key) for key in default_prompts()]


@router.get("/prompts/{key}", response_model=PromptRead)
def get_prompt(key: str, session: SessionDep) -> PromptRead:
    _ensure_known(key)
    return _prompt_read(session, key)


@router.put("/prompts/{key}", response_model=PromptRead)
def edit_prompt(key: str, data: PromptWrite, session: SessionDep) -> PromptRead:
    _ensure_known(key)
    prompt = session.get(Prompt, key) or Prompt(key=key)
    prompt.body = data.body
    session.add(prompt)
    session.commit()
    return _prompt_read(session, key)


@router.delete("/prompts/{key}", status_code=status.HTTP_204_NO_CONTENT)
def reset_prompt(key: str, session: SessionDep) -> None:
    """Go back to the default text."""
    _ensure_known(key)
    edited = session.get(Prompt, key)
    if edited is not None:
        session.delete(edited)
        session.commit()


def _ensure_known(key: str) -> None:
    if key not in default_prompts():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "not found")


def _prompt_read(session: Session, key: str) -> PromptRead:
    edited = session.get(Prompt, key)
    if edited is None:
        return PromptRead(key=key, body=default_prompts()[key], is_default=True)
    return PromptRead(key=key, body=edited.body, is_default=False)
