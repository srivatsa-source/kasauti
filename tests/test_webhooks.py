import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import settings
from app.db.session import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await init_db()

@pytest.mark.asyncio
async def test_webhook_mock_mode_allows_any_ip():
    settings.BOLNA_MODE = "mock"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/webhooks/bolna",
            json={"id": "exec_nonexistent", "status": "completed"}
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "unmatched"

@pytest.mark.asyncio
async def test_webhook_real_mode_rejects_unauthorized_ip():
    settings.BOLNA_MODE = "real"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request with an unauthorized IP in X-Forwarded-For
        resp = await client.post(
            "/webhooks/bolna",
            headers={"X-Forwarded-For": "198.51.100.42"},
            json={"id": "exec_fake", "status": "completed"}
        )
        assert resp.status_code == 403
        assert "Forbidden" in resp.json()["detail"]
    # Restore mock mode
    settings.BOLNA_MODE = "mock"

@pytest.mark.asyncio
async def test_webhook_real_mode_accepts_whitelisted_ip():
    settings.BOLNA_MODE = "real"
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Request with a verified Bolna IP
        resp = await client.post(
            "/webhooks/bolna",
            headers={"X-Forwarded-For": "13.203.39.153"},
            json={"id": "exec_fake_whitelisted", "status": "completed"}
        )
        assert resp.status_code == 200
    # Restore mock mode
    settings.BOLNA_MODE = "mock"
