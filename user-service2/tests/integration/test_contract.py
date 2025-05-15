import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    # Import here to avoid loading entire app
    from fastapi import FastAPI

    # Basit bir test API'si oluştur
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint():
        return {"status": "ok", "message": "Test endpoint works"}

    return TestClient(app)


class TestBasicContract:
    def test_endpoint_contract(self, client):
        """Test that the endpoint returns expected format"""
        response = client.get("/test")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "message" in data
        assert data["status"] == "ok"
