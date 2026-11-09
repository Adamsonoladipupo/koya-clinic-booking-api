from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture
def setup_api():
    with TestClient(app) as client:
        headers = {"X-API-Key": settings.api_key}
        start = datetime.now(UTC) + timedelta(days=7)

        slots = [
            {
                "id": str(uuid4()),
                "provider": "Dr Ade",
                "start": (start + timedelta(hours=i)).isoformat(),
                "end": (start + timedelta(hours=i, minutes=30)).isoformat(),
            }
            for i in range(4)
        ]

        response = client.post(
            "/reset",
            headers=headers,
            json={"slots": slots},
        )
        assert response.status_code == 200

        yield client, headers, slots


def test_idempotent_retry(setup_api):
    client, headers, slots = setup_api
    headers = {**headers, "Idempotency-Key": str(uuid4())}

    payload = {
        "slot_id": slots[0]["id"],
        "name": "Ada Obi",
        "email": "ada@example.com",
    }

    first = client.post("/bookings", headers=headers, json=payload)
    second = client.post("/bookings", headers=headers, json=payload)

    assert first.status_code == 201
    assert second.status_code == 201
    assert first.json()["id"] == second.json()["id"]


def test_idempotency_key_conflict(setup_api):
    client, headers, slots = setup_api
    headers = {**headers, "Idempotency-Key": str(uuid4())}

    payload = {
        "slot_id": slots[0]["id"],
        "name": "Ada Obi",
        "email": "ada@example.com",
    }

    first = client.post("/bookings", headers=headers, json=payload)

    changed = {**payload, "name": "Tunde"}

    second = client.post("/bookings", headers=headers, json=changed)

    assert first.status_code == 201
    assert second.status_code == 422


def test_booking_pagination(setup_api):
    client, headers, slots = setup_api

    for i in range(3):
        response = client.post(
            "/bookings",
            headers=headers,
            json={
                "slot_id": slots[i]["id"],
                "name": f"Patient {i}",
                "email": "ada@example.com",
            },
        )
        assert response.status_code == 201

    first_page = client.get(
        "/bookings",
        headers=headers,
        params={"email": "ADA@EXAMPLE.COM", "limit": 2},
    )

    assert first_page.status_code == 200
    first_data = first_page.json()
    assert len(first_data["bookings"]) == 2
    assert first_data["next_cursor"] is not None

    second_page = client.get(
        "/bookings",
        headers=headers,
        params={
            "email": "ada@example.com",
            "limit": 2,
            "cursor": first_data["next_cursor"],
        },
    )

    assert second_page.status_code == 200
    second_data = second_page.json()
    assert len(second_data["bookings"]) == 1
    assert second_data["next_cursor"] is None

    first_ids = {item["id"] for item in first_data["bookings"]}
    second_ids = {item["id"] for item in second_data["bookings"]}

    assert first_ids.isdisjoint(second_ids)


def test_invalid_pagination_limit(setup_api):
    client, headers, _ = setup_api

    response = client.get(
        "/bookings",
        headers=headers,
        params={"email": "ada@example.com", "limit": 51},
    )

    assert response.status_code == 400
