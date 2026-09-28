# WorkPilot roadmap

Decisions are recorded in [decisions/](decisions/README.md). This file is the high-level plan.

## Versions

| Version | Scope |
|---|---|
| **v0.1 Core loop** (MVP) | Login, PWA, offline-first + sync, i18n system (EN first), Docker image. Short onboarding (you, North Star + milestones, AI provider). Capture bar (Cmd/Ctrl+K) with `/todo`, `/block`, `/idea`. Today (todos + time blocks: done, delete, postpone, link to milestone). Direction (North Star, milestones, progress, "time aligned"). Grove homepage with weather widget. AI foundation + AI ticker. |
| v0.2 Reflection | Review (free journal + daily / weekly / monthly templates). Push reminders (`/remind`). |
| v0.3 AI pilot | AI voice, prompt library, link suggestions, milestone helper, morning plan. Opportunities (ICE + experiments). |
| v0.4 Learning | References + notes. Learning (AI flashcards and quizzes, FSRS). |
| v0.5 Connected | Connectors (GitHub, RSS, email...) feeding Opportunities and Learning. |
| v1.0 | FR / ES complete, methodology info panels everywhere, docs, public release. |

## Design steps (architect order)

1. Vision and scope: done
2. User journeys (high level): done
3. Domain model: done for v0.1
4. Quality requirements: offline, performance, security, privacy, resource budget
5. Architecture decisions: connector model, deployment (done: PostgreSQL only, ADR 0024; offline sync, ADR 0025; AI provider interface, ADR 0026; background jobs, ADR 0027)
6. Feature specs (per version)
7. Data schema: done for v0.1 ([data-model.md](data-model.md))
8. Self-hosting and distribution: free hosting, backups, updates, license
9. UI, built in steps with screenshots (building blocks: ADR 0028): all v0.1 screens built: sign-in, onboarding, Grove homepage, capture bar, Today, Direction, settings

## Open questions

- Capture command list
- References, AI & Connectors, onboarding journey details
- Global search, export / backup
- License
