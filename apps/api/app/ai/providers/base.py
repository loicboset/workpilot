"""What every AI provider offers, and the errors they raise (ADR 0026)."""

from enum import StrEnum
from typing import Protocol

import httpx2
from pydantic import BaseModel

# Local models can be slow, and LM Studio may first have to load the model into memory.
# Connecting is quick, though: a server that isn't running fails in a few seconds.
TIMEOUT = httpx2.Timeout(120.0, connect=5.0)
# One retry covers a brief network hiccup. More would make a slow local model wait minutes.
MAX_RETRIES = 1


class AIProvider(Protocol):
    def generate[Answer: BaseModel](self, prompt: str, answer: type[Answer]) -> Answer:
        """Send the prompt and return the model's answer, checked against `answer`.

        The model is asked for JSON in the shape of `answer` (structured output).
        """
        ...

    def list_models(self) -> list[str]:
        """The ids of the models on offer. Also a quick test of the URL and the key."""
        ...


class AIErrorCode(StrEnum):
    """Stable codes, so the app can show a message in the user's language."""

    NOT_CONFIGURED = "ai_not_configured"
    UNREACHABLE = "ai_unreachable"
    TIMEOUT = "ai_timeout"
    KEY_REJECTED = "ai_key_rejected"
    NOT_FOUND = "ai_not_found"  # an unknown model, or a wrong base URL
    PROVIDER_ERROR = "ai_provider_error"
    INVALID_ANSWER = "ai_invalid_answer"


class AIError(Exception):
    def __init__(self, code: AIErrorCode) -> None:
        super().__init__(code.value)
        self.code = code


def error_for_status(status_code: int) -> AIError:
    """The error for an HTTP error status returned by the provider."""
    if status_code in (401, 403):
        return AIError(AIErrorCode.KEY_REJECTED)
    if status_code == 404:
        return AIError(AIErrorCode.NOT_FOUND)
    return AIError(AIErrorCode.PROVIDER_ERROR)
