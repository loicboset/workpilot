"""Claude, through Anthropic's own Messages API (ADR 0026).

Anthropic's OpenAI-compatible endpoint ignores JSON schemas, so Claude gets its own adapter.
"""

from collections.abc import Iterator
from contextlib import contextmanager

import anthropic
import httpx2
from pydantic import BaseModel, ValidationError

from app.ai.providers.base import MAX_RETRIES, TIMEOUT, AIError, AIErrorCode, error_for_status

# Anthropic requires a limit on the answer's length. WorkPilot's answers are short.
MAX_ANSWER_TOKENS = 2048


class AnthropicProvider:
    def __init__(
        self,
        *,
        api_key: str,
        model: str | None,
        base_url: str | None = None,  # None: Anthropic's API
        http_client: httpx2.Client | None = None,  # tests pass a fake one
    ) -> None:
        self._model = model
        self._client = anthropic.Anthropic(
            api_key=api_key,
            base_url=base_url,
            timeout=TIMEOUT,
            max_retries=MAX_RETRIES,
            http_client=http_client,
        )

    def generate[Answer: BaseModel](self, prompt: str, answer: type[Answer]) -> Answer:
        if not self._model:
            raise AIError(AIErrorCode.NOT_CONFIGURED)
        with _as_ai_errors():
            message = self._client.messages.parse(
                model=self._model,
                max_tokens=MAX_ANSWER_TOKENS,
                messages=[{"role": "user", "content": prompt}],
                output_format=answer,
            )
        if message.parsed_output is None:  # the model refused
            raise AIError(AIErrorCode.INVALID_ANSWER)
        return message.parsed_output

    def list_models(self) -> list[str]:
        with _as_ai_errors():
            return sorted(model.id for model in self._client.models.list())


@contextmanager
def _as_ai_errors() -> Iterator[None]:
    """Turn the SDK's errors into ours."""
    try:
        yield
    except anthropic.APITimeoutError as error:  # before APIConnectionError: it's a subclass
        raise AIError(AIErrorCode.TIMEOUT) from error
    except anthropic.APIConnectionError as error:
        raise AIError(AIErrorCode.UNREACHABLE) from error
    except anthropic.APIStatusError as error:
        raise error_for_status(error.status_code) from error
    except ValidationError as error:
        raise AIError(AIErrorCode.INVALID_ANSWER) from error
