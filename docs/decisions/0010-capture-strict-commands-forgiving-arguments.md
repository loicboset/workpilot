# 0010. Capture: strict commands, forgiving arguments

- Status: Accepted
- Date: 2026-09-27

## Decision

The Capture bar uses fixed slash commands with autocomplete. Arguments are free text; dates are parsed by a deterministic parser that works offline, without AI. A live preview shows what was understood before Enter.

## Why

Slack uses fixed commands with natural-language arguments; Todoist highlights what it parsed. No AI needed, works offline.
