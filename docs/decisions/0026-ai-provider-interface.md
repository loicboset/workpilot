# 0026. AI provider interface

- Status: Accepted
- Date: 2026-09-28

## Context

The AI layer must work with a cloud API or a local model (ADR 0016). The maintainer uses
LM Studio locally. AI answers feed features (the ticker first), so they must come back as
data in a known shape, not free text.

## Decision

- **AI calls run on the server** (`apps/api/app/ai`). The browser never sees the API key, and
  background jobs (ticker) can use the AI.
- **One small interface**, `AIProvider`: `generate(prompt, answer)` returns the model's answer
  as the Pydantic model `answer` (structured output, JSON schema), and `list_models()` lists
  the models on offer (also a connection test).
- **Two adapters**, each on the provider's official SDK:
  - `openai_compatible` (`openai` SDK, base URL + optional key): LM Studio, Ollama, OpenAI,
    OpenRouter, Gemini, Mistral, vLLM…
  - `anthropic` (`anthropic` SDK): Claude through Anthropic's own Messages API.
- Settings stay in the app (`ai_settings`): provider, base URL, model, encrypted key.
  `GET /api/ai/models` uses them.
- Errors become stable codes (`ai_not_configured`, `ai_unreachable`, `ai_timeout`,
  `ai_key_rejected`, `ai_not_found`, `ai_provider_error`, `ai_invalid_answer`) so the app can
  show them in the user's language. The provider's own message goes to the server log.
- Timeout 120 s (connect 5 s) and one retry: local models are slow, but a stopped server
  should fail fast.

## Why

- OpenAI's Chat Completions API is the common language of local servers and most clouds:
  LM Studio documents it for reuse of OpenAI clients; Karakeep and Open WebUI connect to
  providers this way. OpenAI still supports it alongside its newer Responses API.
- Anthropic's OpenAI-compatible endpoint ignores `response_format` (JSON schema) and is "not
  a long-term or production-ready solution", so Claude gets a native adapter.
- No LiteLLM or other gateway: heavy for a two-adapter need, and its PyPI package was
  compromised in March 2026.
- Structured output: LM Studio supports JSON schema (llama.cpp grammars for GGUF, Outlines
  for MLX), but models under ~7B may not follow it. Answers are always validated, and
  features must have a fallback (the ticker shows static tips).

## Consequences

- A hosted server can only use a local model it can reach (same machine, or a private network
  such as Tailscale). Otherwise a hosted install uses a cloud provider.
- Setup guide: [docs/ai-providers.md](../ai-providers.md).
