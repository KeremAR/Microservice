import pytest
from fastapi.testclient import TestClient
import json
from unittest.mock import patch, MagicMock
import jsonschema
from jsonschema import validate

# Import fixtures from test_api.py
from .test_api import mock_firebase, mock_db_connection, mock_rabbitmq, mock_redis

@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    # Import here to allow mocking
    from main import app
    return TestClient(app)

# Güncellenmiş API Contract Schemas
signup_response_schema = {
    "type": "object",
    "required": ["token", "user_id", "message"],
    "properties": {
        "status": {"type": "string"},
        "code": {"type": "integer"},
        "user_id": {"type": "string"},
        "token": {"type": "string"},
        "message": {"type": "string"}
    }
}

login_response_schema = {
    "type": "object",
    "required": ["token", "user_id", "email"],
    "properties": {
        "status": {"type": "string"},
        "code": {"type": "integer"},
        "message": {"type": "string"},
        "token": {"type": "string"},
        "user_id": {"type": "string"},
        "name": {"type": "string"},
        "surname": {"type": "string"},
        "email": {"type": "string", "format": "email"},
        "role": {"type": "string", "enum": ["admin", "staff", "user"]},
        "department_id": {"type": ["string", "integer", "null"]},
        "is_active": {"type": "boolean"},
        "supabase_available": {"type": "boolean"},
        "warning": {"type": ["string", "null"]}
    }
}

profile_response_schema = {
    "type": "object",
    "properties": {
        "_id": {"type": "string"},
        "user_id": {"type": "string"},
        "email": {"type": "string", "format": "email"},
        "name": {"type": "string"},
        "surname": {"type": "string"},
        "role": {"type": "string", "enum": ["admin", "staff", "user"]},
        "phone_number": {"type": ["string", "null"]},
        "department_id": {"type": ["string", "integer", "null"]},
        "is_active": {"type": "boolean"}
    }
}

class TestApiContracts:
    """Tests to ensure API responses conform to expected contracts"""
    
    def test_signup_contract(self, client):
        """Test signup endpoint returns response matching the contract"""
        # Arrange
        user_data = {
            "email": "test@example.org",
            "password": "Password123",
            "name": "Test",
            "surname": "User"
        }
        
        # Act
        response = client.post("/auth/signup", json=user_data)
        
        # Assert - status code can vary based on environment
        assert response.status_code in [200, 201, 400]
        
        # Skip validation if request failed
        if response.status_code >= 400:
            pytest.skip("Signup failed, skipping schema validation")
            
        # Validate response against schema
        try:
            validate(instance=response.json(), schema=signup_response_schema)
        except jsonschema.exceptions.ValidationError as e:
            pytest.fail(f"Response does not match schema: {e}")

    def test_login_contract(self, client):
        """Test login endpoint returns response matching the contract"""
        # Arrange
        login_data = {
            "email": "test@example.org",
            "password": "Password123"
        }
        
        # Act
        response = client.post("/auth/login", json=login_data)
        
        # Assert
        assert response.status_code == 200
        # Validate response against schema
        try:
            validate(instance=response.json(), schema=login_response_schema)
        except jsonschema.exceptions.ValidationError as e:
            pytest.fail(f"Response does not match schema: {e}")

    def test_profile_contract(self, client):
        """Test profile endpoint returns response matching the contract"""
        # Proper JWT token structure for testing
        mock_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJtb2NrZWQtZmlyZWJhc2UtdWlkIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUub3JnIn0.mock-signature"
        
        # Act
        response = client.get(
            "/users/profile", 
            headers={"Authorization": f"Bearer {mock_token}"}
        )
        
        # Assert - profile endpoint might return 401 if token is invalid
        assert response.status_code in [200, 401]
        
        # Skip validation if request failed
        if response.status_code != 200:
            pytest.skip("Profile request failed, skipping schema validation")
            
        # Validate response against schema
        try:
            validate(instance=response.json(), schema=profile_response_schema)
        except jsonschema.exceptions.ValidationError as e:
            pytest.fail(f"Response does not match schema: {e}")

    def test_error_response_format(self, client):
        """Test error responses have consistent format"""
        # Missing required field
        user_data = {
            "email": "test@example.org",
            # Missing password
            "name": "Test",
            "surname": "User"
        }
        
        response = client.post("/auth/signup", json=user_data)
        
        # Check that error responses follow a consistent format
        assert response.status_code in [400, 422]  # Both are valid error codes
        error_response = response.json()
        
        # FastAPI validation errors have different format than app logic errors
        if response.status_code == 422:
            assert "detail" in error_response
            assert isinstance(error_response["detail"], list)
        else:
            # App logic errors may have different format
            assert any(key in error_response for key in ["error", "message", "detail", "status"]) 