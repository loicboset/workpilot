"""Test setup: a PostgreSQL test database, migrated with Alembic, emptied after each test.

Needs a running PostgreSQL (`make db`). The test database is created if it doesn't exist.
Set TEST_DATABASE_URL to use another server.
"""

import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from tests.credentials import TEST_PASSWORD, TEST_USERNAME

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://workpilot:workpilot@localhost:5432/workpilot_test",
)
os.environ["WORKPILOT_DATABASE_URL"] = TEST_DATABASE_URL
os.environ["WORKPILOT_USER"] = f"{TEST_USERNAME}:{TEST_PASSWORD}"
os.environ["WORKPILOT_SECRET_KEY"] = "test-secret-key-that-is-long-enough-for-tests"
os.environ["WORKPILOT_COOKIE_SECURE"] = "false"  # the test client talks plain http
os.environ["WORKPILOT_PUSH_CONTACT"] = "mailto:tests@workpilot.test"

from alembic import command  # noqa: E402
from alembic.config import Config  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.auth.security import login_throttle  # noqa: E402
from app.db.models import Base, Milestone, NorthStar, SyncState  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402

API_DIR = Path(__file__).resolve().parents[1]


def create_database_if_missing(url: str) -> None:
    """Create the test database on first run, via the server's default `postgres` database."""
    database = make_url(url).database
    server = create_engine(make_url(url).set(database="postgres"), isolation_level="AUTOCOMMIT")
    with server.connect() as connection:
        exists = connection.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": database}
        )
        if not exists:
            connection.execute(text(f'CREATE DATABASE "{database}"'))
    server.dispose()


@pytest.fixture(scope="session", autouse=True)
def migrated_database() -> Iterator[None]:
    create_database_if_missing(TEST_DATABASE_URL)
    config = Config(str(API_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(API_DIR / "app/db/migrations"))
    command.upgrade(config, "head")
    yield
    command.downgrade(config, "base")


@pytest.fixture(autouse=True)
def clean_state() -> Iterator[None]:
    yield
    login_throttle.forget_all()
    with SessionLocal() as session:
        for table in reversed(Base.metadata.sorted_tables):
            if table.name != SyncState.__tablename__:  # its single row is created by migration
                session.execute(table.delete())
        session.commit()


@pytest.fixture
def db() -> Iterator[Session]:
    with SessionLocal() as session:
        yield session


@pytest.fixture
def anonymous_client() -> TestClient:
    return TestClient(app)


@pytest.fixture
def client() -> TestClient:
    """A client already signed in."""
    client = TestClient(app)
    response = client.post(
        "/api/auth/login", json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
    )
    assert response.status_code == 204
    return client


@pytest.fixture
def milestone_id(db: Session) -> str:
    """The id of a milestone under a North Star, for tests that link to one."""
    north_star = NorthStar(title="Finish my first novel")
    db.add(north_star)
    db.flush()
    milestone = Milestone(north_star_id=north_star.id, title="First draft done")
    db.add(milestone)
    db.commit()
    return str(milestone.id)
