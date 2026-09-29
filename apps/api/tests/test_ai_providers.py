"""The two AI adapters, against fake HTTP servers (no network, no real model)."""

import json
from collections.abc import Callable

import httpx2
import pytest
from pydantic import BaseModel

from app.ai.providers import AIError, AIErrorCode, AnthropicProvider, OpenAICompatibleProvider

Handler = Callable[[httpx2.Request], httpx2.Response]


class Greeting(BaseModel):
    text: str


def fake_server(handler: Handler, sent: list[httpx2.Request] | None = None) -> httpx2.Client:
    """An HTTP client whose requests are answered by `handler` and recorded in `sent`."""

    def record_and_answer(request: httpx2.Request) -> httpx2.Response:
        if sent is not None:
            sent.append(request)
        return handler(request)

    return httpx2.Client(transport=httpx2.MockTransport(record_and_answer))


def lm_studio(
    handler: Handler, sent: list[httpx2.Request] | None = None, model: str | None = "m"
) -> OpenAICompatibleProvider:
    """The OpenAI-compatible adapter at LM Studio's usual address, answered by `handler`."""
    return OpenAICompatibleProvider(
        base_url="http://localhost:1234/v1", model=model, http_client=fake_server(handler, sent)
    )


def claude(
    handler: Handler, sent: list[httpx2.Request] | None = None, model: str | None = "m"
) -> AnthropicProvider:
    """The Anthropic adapter, answered by `handler`."""
    return AnthropicProvider(api_key="sk-test", model=model, http_client=fake_server(handler, sent))


def chat_completion(content: str, reasoning: str | None = None) -> httpx2.Response:
    message = {"role": "assistant", "content": content}
    if reasoning is not None:
        message["reasoning_content"] = reasoning  # LM Studio's field for a model's thinking
    return httpx2.Response(
        200,
        json={
            "id": "chatcmpl-1",
            "object": "chat.completion",
            "created": 0,
            "model": "m",
            "choices": [
                {
                    "index": 0,
                    "finish_reason": "stop",
                    "message": message,
                }
            ],
        },
    )


def claude_message(text: str) -> httpx2.Response:
    return httpx2.Response(
        200,
        json={
            "id": "msg_1",
            "type": "message",
            "role": "assistant",
            "model": "m",
            "content": [{"type": "text", "text": text}],
            "stop_reason": "end_turn",
            "stop_sequence": None,
            "usage": {"input_tokens": 1, "output_tokens": 1},
        },
    )


# --- OpenAI-compatible (LM Studio) -----------------------------------------------------------


def test_openai_compatible_asks_for_json_in_the_answers_shape() -> None:
    sent: list[httpx2.Request] = []
    provider = lm_studio(lambda _: chat_completion('{"text": "Hello"}'), sent)

    assert provider.generate("Say hello", Greeting) == Greeting(text="Hello")

    request = sent[0]
    assert request.url == "http://localhost:1234/v1/chat/completions"
    body = json.loads(request.content)
    assert body["model"] == "m"
    assert body["messages"] == [{"role": "user", "content": "Say hello"}]
    assert body["response_format"]["type"] == "json_schema"
    assert body["response_format"]["json_schema"]["schema"]["required"] == ["text"]


def test_openai_compatible_finds_an_answer_left_in_the_reasoning() -> None:
    # Qwen3 in LM Studio: the thinking block never closes, so the JSON lands in the reasoning.
    provider = lm_studio(lambda _: chat_completion("", reasoning='{"text": "Hello"}'))

    assert provider.generate("Say hello", Greeting) == Greeting(text="Hello")


def test_openai_compatible_thinking_alone_is_no_answer() -> None:
    provider = lm_studio(lambda _: chat_completion("", reasoning="Let me greet them warmly…"))

    with pytest.raises(AIError) as raised:
        provider.generate("Say hello", Greeting)
    assert raised.value.code == AIErrorCode.INVALID_ANSWER


def test_openai_compatible_lists_models_sorted() -> None:
    models = {"object": "list", "data": [{"id": "qwen3-8b"}, {"id": "gemma-3-12b"}]}
    provider = lm_studio(lambda _: httpx2.Response(200, json=models), model=None)

    assert provider.list_models() == ["gemma-3-12b", "qwen3-8b"]


# --- Anthropic ------------------------------------------------------------------------------


def test_anthropic_asks_for_json_in_the_answers_shape() -> None:
    sent: list[httpx2.Request] = []
    provider = claude(lambda _: claude_message('{"text": "Hello"}'), sent)

    assert provider.generate("Say hello", Greeting) == Greeting(text="Hello")

    request = sent[0]
    assert request.url == "https://api.anthropic.com/v1/messages"
    assert request.headers["x-api-key"] == "sk-test"
    body = json.loads(request.content)
    assert body["model"] == "m"
    assert body["messages"] == [{"role": "user", "content": "Say hello"}]
    assert body["output_config"]["format"]["type"] == "json_schema"


def test_anthropic_lists_models_sorted() -> None:
    def model(model_id: str) -> dict[str, str]:
        return {
            "id": model_id,
            "type": "model",
            "display_name": model_id,
            "created_at": "2026-01-01T00:00:00Z",
        }

    models = {"data": [model("claude-b"), model("claude-a")], "has_more": False}
    provider = claude(lambda _: httpx2.Response(200, json=models), model=None)

    assert provider.list_models() == ["claude-a", "claude-b"]


# --- Both: errors ---------------------------------------------------------------------------

BOTH_PROVIDERS = pytest.mark.parametrize(
    "make_provider", [lm_studio, claude], ids=["lm-studio", "claude"]
)


def refuse_connection(request: httpx2.Request) -> httpx2.Response:
    raise httpx2.ConnectError("connection refused", request=request)


def time_out(request: httpx2.Request) -> httpx2.Response:
    raise httpx2.ReadTimeout("timed out", request=request)


def answer_status(status_code: int) -> Handler:
    # `x-should-retry: false` keeps the SDK from retrying, so the test stays fast.
    return lambda _: httpx2.Response(
        status_code, json={"error": {"message": "no"}}, headers={"x-should-retry": "false"}
    )


@BOTH_PROVIDERS
@pytest.mark.parametrize(
    ("handler", "code"),
    [
        (refuse_connection, AIErrorCode.UNREACHABLE),
        (time_out, AIErrorCode.TIMEOUT),
        (answer_status(401), AIErrorCode.KEY_REJECTED),
        (answer_status(404), AIErrorCode.NOT_FOUND),
        (answer_status(500), AIErrorCode.PROVIDER_ERROR),
    ],
    ids=["unreachable", "timeout", "key-rejected", "not-found", "provider-error"],
)
def test_sdk_errors_become_ai_errors(make_provider, handler: Handler, code: AIErrorCode) -> None:
    with pytest.raises(AIError) as raised:
        make_provider(handler).list_models()

    assert raised.value.code == code


@pytest.mark.parametrize(
    ("make_provider", "answer"),
    [(lm_studio, chat_completion), (claude, claude_message)],
    ids=["lm-studio", "claude"],
)
def test_an_answer_in_the_wrong_shape_is_invalid(make_provider, answer) -> None:
    provider = make_provider(lambda _: answer('{"message": "Hello"}'))

    with pytest.raises(AIError) as raised:
        provider.generate("Say hello", Greeting)

    assert raised.value.code == AIErrorCode.INVALID_ANSWER


@BOTH_PROVIDERS
def test_generating_needs_a_model(make_provider) -> None:
    sent: list[httpx2.Request] = []
    provider = make_provider(lambda _: httpx2.Response(500), sent, model=None)

    with pytest.raises(AIError) as raised:
        provider.generate("Say hello", Greeting)

    assert raised.value.code == AIErrorCode.NOT_CONFIGURED
    assert sent == []
