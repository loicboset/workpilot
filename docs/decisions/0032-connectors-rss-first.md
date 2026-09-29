# 0032. Connectors: RSS first

- Status: Accepted
- Date: 2026-09-30

## Context

Some sources are worth following but not worth reading in full: newsletters, blogs, release
notes. The AI could read them instead, if the app can reach them on its own. ADR 0027 already
plans a job for connectors.

## Decision

**What a connector is**

- A source the server checks on its own: its kind, a name, and an optional instruction for the
  AI ("Tell me only about AI tools"). What the AI makes of it, e.g. a digest, comes later and is
  shown elsewhere.
- Per space (ADR 0031): routes under `/api/spaces/{space_id}/connectors`.
- The first kind is **RSS** (RSS 0.9x to 2.0, Atom, RDF). Later, the kinds that need no sign-in
  flow: a calendar link (ICS), a token (GitHub, Notion…), an email folder (IMAP).

**Screens**

- The **Connectors** card on the homepage only makes and manages connections: list, add,
  change, pause, remove. Each one shows a quiet status: when it was last checked, paused, or
  that the last check failed. No red, no counts.
- Adding a feed takes an address: the feed itself, or a site whose page links to its feed
  (`<link rel="alternate">`). The name is optional: the feed's title by default.

**Data and API**

- `connectors` (server-only): `kind` (`rss`), `name`, `url`, `instruction`?, `paused_at`?, and
  written by the server only: `last_checked_at`?, `last_error`? (a stable code),
  `next_check_at`, `etag`?, `last_modified`?. The same address can't be added twice in a space.
- Standard routes (ADR 0023): list, create, get, `PATCH`, soft delete. Pausing is a `PATCH` of
  `paused_at`. Creating or changing the address checks it first, and answers with a stable code
  when it fails: `feed_unreachable`, `feed_not_found` (no feed at this address),
  `connector_exists`.
- `connector_items` (server-only): `connector_id`, `external_id` (the entry's id, else its link;
  unique per connector), `title`, `url`, `author`?, `published_at`?, `text` (trimmed). Kept 30
  days, then deleted.

**Checking**

- A job every 15 minutes checks the connectors that are due (`next_check_at <= now`, not
  paused); each feed at most once an hour. Conditional requests (`ETag`, `Last-Modified`), so
  an unchanged feed costs almost nothing.
- A failed check is saved as `last_error` and tried again at the next hour. A check that works
  clears it.
- Fetching a user-given address from the server: http and https only, 10 s timeout, at most
  5 MB, at most 5 redirects.
- Parsed with `feedparser`, the long-standing Python feed parser.

## Why

- **RSS first**: one address and no sign-in, and it covers more than blogs: Substack, Ghost and
  Buttondown newsletters, YouTube channels, podcasts, GitHub releases.
- **Server-only, managed online through REST** (TanStack Query, like the AI settings) rather than
  synced (ADR 0025): only the server fetches, a connection does nothing offline, and later
  kinds hold secrets the browser should never keep.
- **The card manages, it doesn't show the news**: a digest is its own place, so the card stays
  a calm list of connections.
- **No "Sign in with Google" (OAuth) for now**: each self-hosted install would have to
  register its own app with the service.
- **No inbound email address** (mail sent to the app): it needs a domain, MX records and an
  inbound mail service. An IMAP folder does the same with less.
