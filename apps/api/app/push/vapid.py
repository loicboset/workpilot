"""This server's VAPID key pair, which signs its push messages (ADR 0011, 0027).

The key is derived from WORKPILOT_SECRET_KEY, so there is no key file to create or back up.
Changing the secret changes the key: each device then has to turn notifications on again.
"""

from functools import cache

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from py_vapid import Vapid02, b64urlencode

from app.crypto import derived_key

# The number of valid P-256 private keys, plus one. A private key is a number in [1, order - 1].
P256_ORDER = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551


@cache
def vapid_key() -> Vapid02:
    secret_number = int.from_bytes(derived_key("workpilot vapid key"))
    private_key = ec.derive_private_key(secret_number % (P256_ORDER - 1) + 1, ec.SECP256R1())
    return Vapid02(private_key=private_key)


def public_key() -> str:
    """The key a browser needs to subscribe (its `applicationServerKey`), in base64url."""
    point = vapid_key().public_key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    return b64urlencode(point)
