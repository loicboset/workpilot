"""The AI provider configured in the app's AI settings (ADR 0026)."""

from typing import Annotated

from fastapi import Depends

from app.ai.providers import (
    AIError,
    AIErrorCode,
    AIProvider,
    AnthropicProvider,
    OpenAICompatibleProvider,
)
from app.crypto import decrypt
from app.db.enums import AIProviderKind
from app.db.models import AISettings
from app.db.session import SessionDep

AI_SETTINGS_ID = 1  # the table holds a single row


def configured_provider(session: SessionDep) -> AIProvider:
    """The provider from the AI settings. Raises `ai_not_configured` if something is missing.

    The model may still be empty here: listing the models is how the user picks one.
    """
    ai_settings = session.get(AISettings, AI_SETTINGS_ID)
    if ai_settings is None:
        raise AIError(AIErrorCode.NOT_CONFIGURED)
    api_key = decrypt(ai_settings.api_key_encrypted) if ai_settings.api_key_encrypted else None

    match ai_settings.provider:
        case AIProviderKind.OPENAI_COMPATIBLE if ai_settings.base_url:
            return OpenAICompatibleProvider(
                base_url=ai_settings.base_url, model=ai_settings.model, api_key=api_key
            )
        case AIProviderKind.ANTHROPIC if api_key:
            return AnthropicProvider(
                api_key=api_key, model=ai_settings.model, base_url=ai_settings.base_url
            )
        case _:
            raise AIError(AIErrorCode.NOT_CONFIGURED)


# For routes: `provider: ProviderDep`. Tests replace it with a fake provider.
ProviderDep = Annotated[AIProvider, Depends(configured_provider)]
