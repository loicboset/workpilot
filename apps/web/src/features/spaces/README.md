# spaces

Separate worlds in one install, like browser profiles (ADR 0031): each space has its own North
Star, days, notes, palette and AI; the profile and light or dark are shared.

- `StartPage` (`/`): the spaces as tiles, in their own colours, archived ones last and greyed out.
  The only place to create, rename, archive and restore a space.
- `SpaceLayout` (`/:space/…`): the space from the URL, given to every page below through
  `SpaceContext` (`data/currentSpace.ts`); applies its palette and sends a space without a North
  Star to `SpaceSetup`. An unknown or archived space leads to `/`.
- `SpaceMenu`: the header menu right of Capture: another space on the same page, or all spaces.
- `useSpacePath`: links inside the page's space, e.g. `spacePath('/today')` is "/work/today".

Repositories read one space: hooks take the page's space, plain functions its id.
