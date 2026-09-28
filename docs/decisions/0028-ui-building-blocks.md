# 0028. UI building blocks: React Aria Components + Tailwind

- Status: Accepted
- Date: 2026-09-28

## Context

The web app needs dialogs, menus, a ⌘K command bar and date/time pickers that work with a
keyboard and a screen reader, in English, French and Spanish (ADR 0005). Building these by
hand is slow and error-prone.

## Decision

- **React Aria Components** (Adobe) give the behaviour: keyboard, focus, screen reader
  labels, locale-aware dates and times. They come unstyled.
- **Tailwind** gives the look, with the Grove tokens in `apps/web/src/styles/index.css`.
  `tailwindcss-react-aria-components` adds short state variants (`pressed:`, `hovered:`,
  `invalid:`…), and `tailwind-variants` + `tailwind-merge` build variants and merge classes,
  as in Adobe's React Aria Tailwind starter kit. Icons: `lucide-react`.
- **Reusable building blocks** live in `src/components/ui`: each wraps a React Aria
  component, keeps its props and adds Grove styling and variants (e.g.
  `<Button variant="quiet" isPending>`). One component per file, named exports, no barrels;
  shared variants in `*.styles.ts` next to them.
- `src/components` never imports app data or features (`features`, `api`, `db`, `data`,
  `sync`): an ESLint rule enforces it.
- Development only: `/dev/ui` shows every building block on one page.

## Why

- Of the headless libraries compared (Radix, Base UI, Headless UI, Ark UI, React Aria), only
  React Aria ships localized date and time pickers and a command palette pattern, and it is
  the most thorough on accessibility.
- Base UI (shadcn/ui's default since July 2026) would have needed extra libraries for dates
  and times and their translations.
- Trade-off accepted: more code per component, and a smaller community than Radix.
