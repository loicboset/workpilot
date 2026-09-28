"""Default prompts shipped with WorkPilot: one Markdown file per prompt in app/ai/prompts/."""

from functools import cache
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"


@cache
def default_prompts() -> dict[str, str]:
    """Prompt key (the file name without .md) → default text."""
    return {
        path.stem: path.read_text(encoding="utf-8")
        for path in sorted(PROMPTS_DIR.glob("*.md"))
        if path.name != "README.md"
    }
