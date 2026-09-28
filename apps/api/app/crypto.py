"""Keys derived from WORKPILOT_SECRET_KEY, and encryption of stored secrets (e.g. the AI key).

Changing WORKPILOT_SECRET_KEY makes existing secrets unreadable: they must be entered again.
"""

import base64
from functools import cache

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.config import settings


def derived_key(purpose: str) -> bytes:
    """32 bytes derived from WORKPILOT_SECRET_KEY. Each purpose gets its own, unrelated key."""
    return HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=purpose.encode(),
    ).derive(settings.secret_key.encode())


@cache
def _fernet() -> Fernet:
    return Fernet(base64.urlsafe_b64encode(derived_key("workpilot stored secrets")))


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()
