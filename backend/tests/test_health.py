from fastapi.testclient import TestClient

from app.core.config import settings
from app.main import app


def test_health_endpoint() -> None:
    client = TestClient(app)

    response = client.get(
        "/health",
        headers={"X-API-Key": settings.api_key},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
