# Prompts

Default prompts shipped with WorkPilot, one Markdown file per prompt. The file name is the
prompt's key (`ticker.md` → `ticker`).

Users can edit prompts in the app. Edited versions are stored in the `prompts` table; these
files stay the defaults, and "reset" goes back to them.

Placeholders use `$name` (Python `string.Template`), so JSON examples in a prompt need no
escaping.
