# capture

Slash commands, as in Slack or Claude (ADR 0010): /todo, /block, /idea, /note, /icebox. Typing "/"
opens the command menu; plain text becomes an idea. A /todo without a day is due today; /icebox
keeps a todo without a date (ADR 0029). In a /todo or an /icebox, `!1`, `!2` or `!3` anywhere
sets its priority, 1 being the most important (ADR 0030): typing `!` opens the priorities, and
the preview's priority can be pressed to change it. The same `CaptureComposer` runs in the
command bar (Cmd/Ctrl+K from anywhere) and in the homepage Capture card.
