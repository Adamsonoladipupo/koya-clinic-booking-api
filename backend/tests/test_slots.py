from datetime import UTC, datetime, timedelta
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app

client = TestClient(app)
headers = {"X-API-Key": settings.api_key}


def make_slot(provider: str = "Dr Ade") -> dict:
    start = datetime.now(UTC) + timedelta(days=7)

    return {
        "id": str(uuid4()),
        "provider": provider,
        "start": start.isoformat(),
        "end": (start + timedelta(minutes=30)).isoformat(),
    }


def test_slots_requires_api_key():
    response = client.get("/slots")

    assert response.status_code == 401
    assert "error" in response.json()


def test_reset_and_list_slots():
    slot = make_slot()

    reset_response = client.post(
        "/reset",
        headers=headers,
        json={"slots": [slot]},
    )

    assert reset_response.status_code == 200

    response = client.get("/slots", headers=headers)

    assert response.status_code == 200
    assert len(response.json()["slots"]) == 1
    assert response.json()["slots"][0]["id"] == slot["id"]
    assert response.json()["slots"][0]["available"] is True


def test_filter_slots_by_provider():
    first = make_slot("Dr Ade")
    second = make_slot("Dr Bola")

    client.post(
        "/reset",
        headers=headers,
        json={"slots": [first, second]},
    )

    response = client.get(
        "/slots",
        headers=headers,
        params={"provider": "Dr Ade"},
    )

    assert response.status_code == 200
    assert len(response.json()["slots"]) == 1
    assert response.json()["slots"][0]["provider"] == "Dr Ade"
