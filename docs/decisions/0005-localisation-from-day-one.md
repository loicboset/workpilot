# 0005. Localisation from day one

- Status: Accepted
- Date: 2026-09-27

## Decision

Launch languages: English, French, Spanish. Adding a language means adding a translation file, no code change. Dates, times and numbers follow the user's locale. AI output follows the user's language.

## Why

Retrofitting i18n is expensive. A test checks that all locale files have the same keys.
