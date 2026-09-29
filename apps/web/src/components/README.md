# components

Reusable pieces with no app data (ADR 0028). Features compose them; they never reach into
`features`, `api`, `db`, `data` or `sync` (ESLint enforces it).

- `ui/`: building blocks. Each wraps a React Aria component, keeps its props, and adds the
  Grove look (Tailwind) and variants. Shared variants live in `*.styles.ts`.
- `brand/`: the WorkPilot logo.

See them all with `pnpm dev`, then open `/dev/ui`.

| Block                            | Use it for                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------- |
| `Button`                         | Actions. `variant`: primary, secondary, quiet, danger. `size`: md, sm. `isPending` while it works.  |
| `IconButton`                     | An action shown as an icon only. `aria-label` is required.                                          |
| `Link`                           | Navigation. App paths go through React Router.                                                      |
| `TextField`                      | Labelled text input or text area (`multiline`), with help text and error.                           |
| `Field`                          | The parts of fields (`Label`, `Description`, `FieldError`, `Input`, `TextArea`), to build new ones. |
| `Form`                           | A form with even spacing; errors show on the fields, never as browser pop-ups.                      |
| `Card`                           | The Grove surface: optional icon, title, subtitle, actions.                                         |
| `Alert`                          | A short message: info, success, error (announced to screen readers).                                |
| `Spinner`                        | Something is loading. Give it a `label` when it stands alone.                                       |
| `Checkbox`                       | Done / not done, with its label.                                                                    |
| `Select`, `ListBoxItem`          | Pick one option from a short list.                                                                  |
| `ComboBox`                       | Type to filter a long list (timezones), or type your own value.                                     |
| `DatePicker`, `Calendar`         | A day, typed in the locale's order or picked in a month.                                            |
| `TimeField`                      | A time of day, in the locale's format.                                                              |
| `Meter`                          | How full something is ("time aligned this week").                                                   |
| `Menu`, `MenuItem`               | Actions in a popover, with submenus (`SubmenuTrigger`).                                             |
| `Modal`, `Dialog`, `DialogTitle` | A window over the page; Esc closes it.                                                              |
| `Popover`                        | A floating panel next to what opened it.                                                            |
| `MethodInfo`                     | The ⓘ explaining the method a feature is built on (ADR 0014).                                       |
| `PageTitle`                      | A page's title and subtitle, after a small arrow back to `backHref` (a space's homepage).           |
| `PriorityBadge`, `PriorityIcon`  | A todo's priority: "P1" with its bars, or the bars alone (ADR 0030).                                |
