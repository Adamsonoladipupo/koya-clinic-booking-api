from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


@pytest.fixture
def api():
    with TestClient(app) as client:
        headers = {"X-API-Key": settings.api_key}
        start = datetime.now(UTC) + timedelta(days=7)

        reset = client.post(
            "/reset",
            headers=headers,
            json={
                "slots": [
                    {
                        "id": str(uuid4()),
                        "provider": "Dr Ade",
                        "start": start.isoformat(),
                        "end": (start + timedelta(minutes=30)).isoformat(),
                    }
                ]
            },
        )

        assert reset.status_code == 200
        yield client, headers


def attempt(client, headers, email):
    return client.post(
        "/bookings",
        headers=headers,
        json={
            "slot_id": str(uuid4()),
            "name": "Test Patient",
            "email": email,
        },
    )


def test_sixth_attempt_returns_429(api):
    client, headers = api

    for _ in range(5):
        response = attempt(client, headers, "ada@example.com")
        assert response.status_code == 404

    sixth = attempt(client, headers, "ada@example.com")

    assert sixth.status_code == 429
    assert "error" in sixth.json()

    retry_after = sixth.headers.get("Retry-After")
    assert retry_after is not None
    assert retry_after.isdigit()
    assert int(retry_after) > 0


def test_rate_limit_is_per_email(api):
    client, headers = api

    for _ in range(5):
        attempt(client, headers, "ada@example.com")

    blocked = attempt(client, headers, "ada@example.com")
    assert blocked.status_code == 429

    other_patient = attempt(client, headers, "tunde@example.com")
    assert other_patient.status_code == 404


def test_concurrent_attempts_respect_limit(api):
    client, headers = api

    def make_request(_):
        return attempt(client, headers, "concurrent@example.com").status_code

    with ThreadPoolExecutor(max_workers=6) as executor:
        statuses = list(executor.map(make_request, range(6)))

    assert statuses.count(404) == 5
    assert statuses.count(429) == 1
