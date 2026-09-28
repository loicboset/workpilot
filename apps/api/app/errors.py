"""API-wide error handling.

The database is the source of truth for integrity rules (primary keys, unique columns,
foreign keys, checks). Routes don't pre-check them: a violation raises IntegrityError on
commit and is answered here, once, for every resource (ADR 0022).

AI provider failures are answered here too, with a stable code the app can translate
(ADR 0026).
"""

import logging

from fastapi import Request, status
from fastapi.responses import JSONResponse
from psycopg.errors import UniqueViolation
from sqlalchemy.exc import IntegrityError

from app.ai.providers import AIError, AIErrorCode

logger = logging.getLogger(__name__)


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


AI_ERROR_STATUS = {
    AIErrorCode.NOT_CONFIGURED: status.HTTP_409_CONFLICT,
    AIErrorCode.TIMEOUT: status.HTTP_504_GATEWAY_TIMEOUT,
}


async def ai_error_handler(_request: Request, error: AIError) -> JSONResponse:
    """Answer 409 when the AI isn't set up, 504 when it timed out, 502 for any other failure.

    The response holds only the error code; the provider's own message goes to the server log.
    """
    if error.__cause__ is not None:
        logger.warning("AI provider error (%s): %s", error.code, error.__cause__)
    return JSONResponse(
        status_code=AI_ERROR_STATUS.get(error.code, status.HTTP_502_BAD_GATEWAY),
        content={"detail": error.code},
    )
