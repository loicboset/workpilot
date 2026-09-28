"""Encryption of stored secrets (e.g. the AI key), with a key derived from WORKPILOT_SECRET_KEY.

Changing WORKPILOT_SECRET_KEY makes existing secrets unreadable: they must be entered again.
"""

import base64
from functools import cache

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.config import settings


@cache
def _fernet() -> Fernet:
    key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"workpilot stored secrets",
    ).derive(settings.secret_key.encode())
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt(plaintext: str) -> str:
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt(token: str) -> str:
    return _fernet().decrypt(token.encode()).decode()
