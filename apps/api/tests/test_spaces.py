"""Spaces: separate worlds in one install, archived rather than deleted (ADR 0031)."""

import uuid

import pytest
from alembic import command
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import engine
from app.domain.spaces.slug import slugify
from tests.conftest import alembic_config


def create_space(client: TestClient, name: str, **fields: object) -> dict:
    response = client.post("/api/spaces", json={"name": name, **fields})
    assert response.status_code == 201
    return response.json()


@pytest.mark.parametrize(
    ("name", "slug"),
    [
        ("Work", "work"),
        ("Côté pro", "cote-pro"),
        ("  Kaizen   Way ", "kaizen-way"),
        ("Café & Co.", "cafe-co"),
        ("İstanbul", "istanbul"),
        ("🚀 Side projects", "side-projects"),
        ("🚀", ""),
        ("a" * 70, "a" * 60),
    ],
)
def test_the_url_name_comes_from_the_name(name: str, slug: str) -> None:
    assert slugify(name) == slug


def test_create_and_list_oldest_first(client: TestClient) -> None:
    personal = create_space(client, "Personal")
    work = create_space(client, "Côté pro", palette="lake")

    assert work["slug"] == "cote-pro"
    assert (personal["palette"], work["palette"]) == ("grove", "lake")
    assert personal["archived_at"] is None
    assert [space["name"] for space in client.get("/api/spaces").json()] == [
        "Personal",
        "Côté pro",
    ]


def test_names_are_unique_whatever_the_case_and_accents(client: TestClient) -> None:
    create_space(client, "Côté pro")

    response = client.post("/api/spaces", json={"name": "cote PRO"})

    assert response.status_code == 409


@pytest.mark.parametrize("name", ["Sign in", "API", "Onboarding"])
def test_a_name_cant_take_a_url_the_app_uses(client: TestClient, name: str) -> None:
    assert client.post("/api/spaces", json={"name": name}).status_code == 422


def test_a_name_needs_a_letter_or_a_digit(client: TestClient) -> None:
    response = client.post("/api/spaces", json={"name": "🚀"})

    assert response.status_code == 422
    assert response.json() == {"detail": "the name needs a letter or a digit"}


def test_renaming_changes_the_url_name(client: TestClient) -> None:
    space = create_space(client, "Work")

    renamed = client.patch(f"/api/spaces/{space['id']}", json={"name": "Client work"}).json()

    assert renamed["slug"] == "client-work"


def test_archive_and_restore(client: TestClient) -> None:
    create_space(client, "Personal")
    work = create_space(client, "Work")
    url = f"/api/spaces/{work['id']}"

    client.patch(url, json={"archived_at": "2026-09-30T10:00:00Z"})
    active = client.get("/api/spaces", params={"archived": False}).json()
    archived = client.get("/api/spaces", params={"archived": True}).json()
    assert [space["name"] for space in active] == ["Personal"]
    assert [space["name"] for space in archived] == ["Work"]

    assert client.patch(url, json={"archived_at": None}).json()["archived_at"] is None


def test_a_space_is_never_deleted(client: TestClient) -> None:
    space = create_space(client, "Work")

    assert client.delete(f"/api/spaces/{space['id']}").status_code == 405


def test_an_unknown_space_is_a_404(client: TestClient) -> None:
    assert client.get(f"/api/spaces/{uuid.uuid4()}").status_code == 404
    assert client.get(f"/api/spaces/{uuid.uuid4()}/todos").status_code == 404


def test_each_space_sees_only_its_own_rows(client: TestClient, in_space: str) -> None:
    work = f"/api/spaces/{create_space(client, 'Work')['id']}"
    mine = client.post(f"{in_space}/todos", json={"title": "Call mum"}).json()
    client.post(f"{work}/todos", json={"title": "Ship the release"})

    assert [todo["title"] for todo in client.get(f"{in_space}/todos").json()] == ["Call mum"]
    assert mine["space_id"] == in_space.rsplit("/", 1)[1]
    assert client.get(f"{work}/todos/{mine['id']}").status_code == 404
    assert client.patch(f"{work}/todos/{mine['id']}", json={"title": "x"}).status_code == 404
    assert client.delete(f"{work}/todos/{mine['id']}").status_code == 404


def test_a_link_to_another_spaces_milestone_is_refused(
    client: TestClient, milestone_id: str
) -> None:
    work = f"/api/spaces/{create_space(client, 'Work')['id']}"

    response = client.post(f"{work}/todos", json={"title": "Outline", "milestone_id": milestone_id})

    assert response.status_code == 422


# --- The migration (0007) -------------------------------------------------------------------


def test_the_data_from_before_spaces_goes_into_a_first_space(db: Session) -> None:
    config = alembic_config()
    command.downgrade(config, "0006")
    try:
        with engine.begin() as connection:
            for statement in [
                "INSERT INTO profiles (id, first_name, locale, timezone, theme, palette, "
                "created_at, updated_at) VALUES (gen_random_uuid(), 'Loïc', 'fr', "
                "'Europe/Zurich', 'dark', 'lake', now(), now())",
                "INSERT INTO north_stars (id, title, created_at, updated_at) "
                "VALUES ('11111111-1111-1111-1111-111111111111', 'Ship it', now(), now())",
                "INSERT INTO milestones (id, north_star_id, title, position, created_at, "
                "updated_at) VALUES ('22222222-2222-2222-2222-222222222222', "
                "'11111111-1111-1111-1111-111111111111', 'Beta', 0, now(), now())",
                "INSERT INTO todos (id, title, milestone_id, created_at, updated_at) VALUES "
                "(gen_random_uuid(), 'Linked', '22222222-2222-2222-2222-222222222222', now(), "
                "now())",
                "INSERT INTO ai_settings (id, provider, base_url, updated_at) "
                "VALUES (1, 'openai_compatible', 'http://localhost:1234/v1', now())",
                "INSERT INTO prompts (key, body, updated_at) VALUES ('ticker', 'Short.', now())",
            ]:
                connection.execute(text(statement))
            revision_before = connection.scalar(text("SELECT max(revision) FROM todos"))
    finally:
        command.upgrade(config, "head")

    space = db.execute(text("SELECT id, name, slug, palette FROM spaces")).one()
    assert (space.name, space.slug, space.palette) == ("Mon espace", "mon-espace", "lake")
    for table in ("north_stars", "milestones", "todos", "ai_settings", "prompts"):
        space_ids = db.scalars(text(f"SELECT DISTINCT space_id FROM {table}")).all()
        assert space_ids == [space.id], table
    # Every device pulls the rows again, now with their space.
    assert db.scalar(text("SELECT min(revision) FROM todos")) > revision_before


def test_a_new_install_gets_no_space(db: Session) -> None:
    config = alembic_config()
    command.downgrade(config, "0006")
    command.upgrade(config, "head")

    # Nothing to hold yet: onboarding makes the first space.
    assert db.scalar(text("SELECT count(*) FROM spaces")) == 0
