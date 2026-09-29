"""Any server that speaks OpenAI's Chat Completions API (ADR 0026).

LM Studio, Ollama, OpenAI, OpenRouter, Gemini, Mistral… The base URL decides which.
"""

from collections.abc import Iterator
from contextlib import contextmanager

import httpx2
import openai
from openai.types.chat import ParsedChatCompletionMessage
from pydantic import BaseModel, ValidationError

from app.ai.providers.base import MAX_RETRIES, TIMEOUT, AIError, AIErrorCode, error_for_status

# Local servers such as LM Studio don't need a key by default, but the SDK requires one.
NO_KEY = "not-needed"


class OpenAICompatibleProvider:
    def __init__(
        self,
        *,
        base_url: str,
        model: str | None,
        api_key: str | None = None,
        http_client: httpx2.Client | None = None,  # tests pass a fake one
    ) -> None:
        self._model = model
        self._client = openai.OpenAI(
            base_url=base_url,
            api_key=api_key or NO_KEY,
            timeout=TIMEOUT,
            max_retries=MAX_RETRIES,
            http_client=http_client,
        )

    def generate[Answer: BaseModel](self, prompt: str, answer: type[Answer]) -> Answer:
        if not self._model:
            raise AIError(AIErrorCode.NOT_CONFIGURED)
        with _as_ai_errors():
            completion = self._client.chat.completions.parse(
                model=self._model,
                messages=[{"role": "user", "content": prompt}],
                response_format=answer,
            )
        message = completion.choices[0].message
        parsed = message.parsed or _answer_in_reasoning(message, answer)
        if parsed is None:  # the model refused
            raise AIError(AIErrorCode.INVALID_ANSWER)
        return parsed

    def list_models(self) -> list[str]:
        with _as_ai_errors():
            return sorted(model.id for model in self._client.models.list())


def _answer_in_reasoning[Answer: BaseModel](
    message: ParsedChatCompletionMessage[Answer], answer: type[Answer]
) -> Answer | None:
    """The answer a reasoning model left in `reasoning_content`, with `content` empty.

    Qwen3 in LM Studio does this: its template opens a thinking block, and the forced JSON
    never closes it, so the server files the whole answer as reasoning.
    """
    reasoning = (message.model_extra or {}).get("reasoning_content")
    if message.content or not isinstance(reasoning, str):
        return None
    try:
        return answer.model_validate_json(reasoning)
    except ValidationError:
        return None


@contextmanager
def _as_ai_errors() -> Iterator[None]:
    """Turn the SDK's errors into ours."""
    try:
        yield
    except openai.APITimeoutError as error:  # before APIConnectionError: it's a subclass
        raise AIError(AIErrorCode.TIMEOUT) from error
    except openai.APIConnectionError as error:
        raise AIError(AIErrorCode.UNREACHABLE) from error
    except openai.APIStatusError as error:
        raise error_for_status(error.status_code) from error
    except (openai.LengthFinishReasonError, ValidationError) as error:
        raise AIError(AIErrorCode.INVALID_ANSWER) from error
