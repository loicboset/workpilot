"""The AI provider configured in the app's AI settings (ADR 0026)."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.ai.default_prompts import default_prompts
from app.ai.providers import (
    AIError,
    AIErrorCode,
    AIProvider,
    AnthropicProvider,
    OpenAICompatibleProvider,
)
from app.crypto import decrypt
from app.db.enums import AIProviderKind
from app.db.models import AISettings, Prompt
from app.db.session import SessionDep

AI_SETTINGS_ID = 1  # the table holds a single row


def configured_provider(session: SessionDep) -> AIProvider:
    """The provider from the AI settings. Raises `ai_not_configured` if something is missing.

    The model may still be empty here: listing the models is how the user picks one.
    """
    ai_settings = session.get(AISettings, AI_SETTINGS_ID)
    if ai_settings is None:
        raise AIError(AIErrorCode.NOT_CONFIGURED)
    return make_provider(
        ai_settings.provider,
        base_url=ai_settings.base_url,
        model=ai_settings.model,
        api_key=stored_api_key(session),
    )


def make_provider(
    kind: AIProviderKind, *, base_url: str | None, model: str | None, api_key: str | None
) -> AIProvider:
    """The provider for these settings, saved or not. Raises `ai_not_configured` if incomplete."""
    match kind:
        case AIProviderKind.OPENAI_COMPATIBLE if base_url:
            return OpenAICompatibleProvider(base_url=base_url, model=model, api_key=api_key)
        case AIProviderKind.ANTHROPIC if api_key:
            return AnthropicProvider(api_key=api_key, model=model, base_url=base_url)
        case _:
            raise AIError(AIErrorCode.NOT_CONFIGURED)


def stored_api_key(session: Session) -> str | None:
    """The saved API key, decrypted."""
    ai_settings = session.get(AISettings, AI_SETTINGS_ID)
    if ai_settings is None or ai_settings.api_key_encrypted is None:
        return None
    return decrypt(ai_settings.api_key_encrypted)


# For routes: `provider: ProviderDep`. Tests replace it with a fake provider.
ProviderDep = Annotated[AIProvider, Depends(configured_provider)]


def prompt_text(session: Session, key: str) -> str:
    """The prompt as the user edited it, or its default."""
    edited = session.get(Prompt, key)
    return edited.body if edited is not None else default_prompts()[key]
