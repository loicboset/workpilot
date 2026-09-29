"""The AI provider configured in a space's AI settings (ADR 0026, 0031)."""

import uuid
from typing import Annotated

from fastapi import Depends
from sqlalchemy import select
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
from app.domain.spaces.current import CurrentSpace


def configured_provider(session: SessionDep, space: CurrentSpace) -> AIProvider:
    """The provider from the space's AI settings. Raises `ai_not_configured` if something is
    missing.

    The model may still be empty here: listing the models is how the user picks one.
    """
    ai_settings = session.get(AISettings, space.id)
    if ai_settings is None:
        raise AIError(AIErrorCode.NOT_CONFIGURED)
    return make_provider(
        ai_settings.provider,
        base_url=ai_settings.base_url,
        model=ai_settings.model,
        api_key=stored_api_key(session, space.id),
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


def stored_api_key(session: Session, space_id: uuid.UUID) -> str | None:
    """The space's saved API key, decrypted."""
    ai_settings = session.get(AISettings, space_id)
    if ai_settings is None or ai_settings.api_key_encrypted is None:
        return None
    return decrypt(ai_settings.api_key_encrypted)


# For routes: `provider: ProviderDep`. Tests replace it with a fake provider.
ProviderDep = Annotated[AIProvider, Depends(configured_provider)]


def prompt_text(session: Session, space_id: uuid.UUID, key: str) -> str:
    """The prompt as the user edited it in the space, or its default."""
    edited = session.get(Prompt, (space_id, key))
    return edited.body if edited is not None else default_prompts()[key]


def copy_ai_settings(session: Session, from_space_id: uuid.UUID, to_space_id: uuid.UUID) -> None:
    """Start a new space with another space's AI settings and edited prompts (ADR 0031).

    What the new space already has is kept. The caller commits.
    """
    source = session.get(AISettings, from_space_id)
    if source is not None and session.get(AISettings, to_space_id) is None:
        session.add(
            AISettings(
                space_id=to_space_id,
                provider=source.provider,
                base_url=source.base_url,
                model=source.model,
                api_key_encrypted=source.api_key_encrypted,
            )
        )
    for prompt in session.scalars(select(Prompt).where(Prompt.space_id == from_space_id)):
        if session.get(Prompt, (to_space_id, prompt.key)) is None:
            session.add(Prompt(space_id=to_space_id, key=prompt.key, body=prompt.body))
