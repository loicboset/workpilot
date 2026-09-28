"""API-wide error handling.

The database is the source of truth for integrity rules (primary keys, unique columns,
foreign keys, checks). Routes don't pre-check them: a violation raises IntegrityError on
commit and is answered here, once, for every resource (ADR 0022).
"""

from fastapi import Request, status
from fastapi.responses import JSONResponse
from psycopg.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError


async def integrity_error_handler(_request: Request, error: IntegrityError) -> JSONResponse:
    """Answer 409 for a duplicate, 422 for any other broken rule.

    Examples: the same id sent twice is a 409; a link to a row that doesn't exist is a 422.
    Database details are never included in the response.
    """
    if isinstance(error.orig, UniqueViolation):
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={"detail": "already exists"},
        )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": "invalid reference or value"},
    )
