from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def headers():
    return {"X-API-Key": settings.api_key}


@pytest.fixture
def slot(client, headers):
    start = datetime.now(UTC) + timedelta(days=7)
    slot_id = str(uuid4())

    payload = {
        "slots": [
            {
                "id": slot_id,
                "provider": "Dr Ade",
                "start": start.isoformat(),
                "end": (start + timedelta(minutes=30)).isoformat(),
            }
        ]
    }

    response = client.post("/reset", headers=headers, json=payload)
    assert response.status_code == 200

    return slot_id


def test_create_booking(client, headers, slot):
    response = client.post(
        "/bookings",
        headers=headers,
        json={
            "slot_id": slot,
            "name": "  Ada Obi  ",
            "email": "  ADA@EXAMPLE.COM  ",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Ada Obi"
    assert data["email"] == "ada@example.com"
    assert data["status"] == "confirmed"


def test_missing_slot_returns_404(client, headers, slot):
    response = client.post(
        "/bookings",
        headers=headers,
        json={
            "slot_id": str(uuid4()),
            "name": "Ada Obi",
            "email": "ada@example.com",
        },
    )

    assert response.status_code == 404
    assert "error" in response.json()


def test_invalid_email_returns_400(client, headers, slot):
    response = client.post(
        "/bookings",
        headers=headers,
        json={
            "slot_id": slot,
            "name": "Ada Obi",
            "email": "not-an-email",
        },
    )

    assert response.status_code == 400
    assert "error" in response.json()


def test_duplicate_booking_returns_409(client, headers, slot):
    payload = {
        "slot_id": slot,
        "name": "Ada Obi",
        "email": "ada@example.com",
    }

    first = client.post("/bookings", headers=headers, json=payload)
    second = client.post("/bookings", headers=headers, json=payload)

    assert first.status_code == 201
    assert second.status_code == 409


def test_cancel_booking_frees_slot(client, headers, slot):
    created = client.post(
        "/bookings",
        headers=headers,
        json={
            "slot_id": slot,
            "name": "Ada Obi",
            "email": "ada@example.com",
        },
    )

    assert created.status_code == 201
    booking_id = created.json()["id"]

    cancelled = client.delete(
        f"/bookings/{booking_id}",
        headers=headers,
    )

    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    slots = client.get("/slots", headers=headers)
    assert slots.json()["slots"][0]["available"] is True


def test_concurrent_booking_only_one_succeeds(client, headers, slot):
    def attempt_booking(index):
        return client.post(
            "/bookings",
            headers=headers,
            json={
                "slot_id": slot,
                "name": f"Patient {index}",
                "email": f"patient{index}@example.com",
            },
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(executor.map(attempt_booking, [1, 2]))

    assert sorted(statuses) == [201, 409]


def test_concurrent_cancellation_only_one_succeeds(client, headers, slot):
    created = client.post(
        "/bookings",
        headers=headers,
        json={
            "slot_id": slot,
            "name": "Ada Obi",
            "email": "ada@example.com",
        },
    )

    assert created.status_code == 201
    booking_id = created.json()["id"]

    # def attempt_cancellation():
    #     return client.delete(
    #         f"/bookings/{booking_id}",
    #         headers=headers,
    #     ).status_code

    def attempt_cancellation(_):
        return client.delete(
            f"/bookings/{booking_id}",
            headers=headers,
        ).status_code

    with ThreadPoolExecutor(max_workers=2) as executor:
        statuses = list(executor.map(attempt_cancellation, [None, None]))

    assert sorted(statuses) == [200, 409]
