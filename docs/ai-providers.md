# AI providers

WorkPilot's AI is optional. It runs on the server and works with a local model or a cloud
API ([ADR 0026](decisions/0026-ai-provider-interface.md)). Each space has its own AI settings
([ADR 0031](decisions/0031-spaces.md)), e.g. a company key for Work and LM Studio for
Personal; a new space starts with a copy of the space it was created from. Set them up in the
space's Settings (or with `PATCH /api/spaces/{space_id}/ai/settings`), then check them with
`GET /api/spaces/{space_id}/ai/models`.

| Setting | Meaning |
|---|---|
| `provider` | `openai_compatible` or `anthropic` |
| `base_url` | Where the AI server is. Required for `openai_compatible`; leave empty for Claude. |
| `model` | The model id, as listed by `GET /api/spaces/{space_id}/ai/models` |
| `api_key` | Required for cloud providers and for `anthropic`; stored encrypted |

## LM Studio (local)

1. In LM Studio, download a model of about 7B parameters or more (small models often ignore
   the requested JSON shape), then start the server in the **Developer** tab (port 1234).
2. In WorkPilot, set `provider` to `openai_compatible` and `base_url` to:

   | WorkPilot runs… | Base URL | LM Studio settings |
   |---|---|---|
   | in Docker Desktop (Mac, Windows), same computer, `make dev` included | `http://host.docker.internal:1234/v1` | none |
   | in Docker on Linux, same computer, `make dev` included | `http://host.docker.internal:1234/v1` | turn on **Serve on Local Network** and **Require Authentication** |
   | on another machine | an address that machine can reach (e.g. over Tailscale) | same as above |

3. Pick the model from `GET /api/spaces/{space_id}/ai/models`. If LM Studio loads models on demand, the first
   answer can take a while.

With **Require Authentication** on, create a token in LM Studio (Server Settings → Manage
Tokens) and save it as `api_key`.

## Other providers

| Provider | `provider` | `base_url` |
|---|---|---|
| Claude (Anthropic) | `anthropic` | empty |
| OpenAI | `openai_compatible` | `https://api.openai.com/v1` |
| OpenRouter | `openai_compatible` | `https://openrouter.ai/api/v1` |
| Google Gemini | `openai_compatible` | `https://generativelanguage.googleapis.com/v1beta/openai` |
| Mistral | `openai_compatible` | `https://api.mistral.ai/v1` |
| Ollama (local) | `openai_compatible` | `http://localhost:11434/v1` |

## Errors

AI routes answer `409 ai_not_configured` when a setting is missing, `504 ai_timeout`, and
`502` with `ai_unreachable`, `ai_key_rejected`, `ai_not_found` (model or URL),
`ai_provider_error` or `ai_invalid_answer`. The server log has the provider's own message.
