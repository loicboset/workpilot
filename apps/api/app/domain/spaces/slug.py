"""A space's name in URLs: "Côté pro" → `/cote-pro` (ADR 0031)."""

import re
import unicodedata

from app.db.models.space import SLUG_MAX_LENGTH


def slugify(name: str) -> str:
    """Lowercase letters and digits, words joined by "-". The web app follows the same rule
    (apps/web/src/data/spaces.ts); empty when the name has neither letters nor digits."""
    decomposed = unicodedata.normalize("NFKD", name.lower())
    plain = "".join(char for char in decomposed if not unicodedata.combining(char))
    slug = re.sub(r"[^a-z0-9]+", "-", plain).strip("-")
    return slug[:SLUG_MAX_LENGTH].rstrip("-")
