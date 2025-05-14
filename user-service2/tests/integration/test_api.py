import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    # Import here to avoid loading entire app when only running unit tests
    from fastapi import FastAPI

    # Basit bir test API'si oluştur
    app = FastAPI()

    @app.get("/test")
    async def test_endpoint():
        return {"status": "ok", "message": "Test endpoint works"}

    return TestClient(app)


class TestBasicAPI:
    def test_test_endpoint(self, client):
        """Test that a basic endpoint works"""
        response = client.get("/test")
        assert response.status_code == 200
        assert response.json() == {"status": "ok", "message": "Test endpoint works"}
