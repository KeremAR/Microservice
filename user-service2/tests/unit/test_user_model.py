import pytest
from models.user_model import SignUpSchema, LoginSchema, UserSchema, ResetPasswordRequest
from pydantic import ValidationError

class TestSignUpSchema:
    def test_valid_signup(self):
        """Test that a valid signup schema passes validation"""
        user_data = {
            "email": "test@example.org",
            "password": "Password123",
            "name": "Test",
            "surname": "User"
        }
        user = SignUpSchema(**user_data)
        assert user.email == "test@example.org"
        assert user.password == "Password123"
        assert user.name == "Test"
        assert user.surname == "User"
        assert user.role == "user"  # Default role

    def test_invalid_email(self):
        """Test that an invalid email is rejected"""
        user_data = {
            "email": "test@example.com",  # This domain is blocked in the validator
            "password": "Password123",
            "name": "Test",
            "surname": "User"
        }
        with pytest.raises(ValidationError):
            SignUpSchema(**user_data)

    def test_weak_password(self):
        """Test that weak passwords are rejected"""
        # Password without uppercase
        user_data = {
            "email": "test@example.org",
            "password": "password123",
            "name": "Test",
            "surname": "User"
        }
        with pytest.raises(ValidationError):
            SignUpSchema(**user_data)

        # Password without number
        user_data["password"] = "Password"
        with pytest.raises(ValidationError):
            SignUpSchema(**user_data)

        # Password too short
        user_data["password"] = "Pass1"
        with pytest.raises(ValidationError):
            SignUpSchema(**user_data)

    def test_invalid_phone(self):
        """Test that invalid phone numbers are rejected"""
        user_data = {
            "email": "test@example.org",
            "password": "Password123",
            "name": "Test",
            "surname": "User",
            "phone_number": "invalid"  # Not a valid phone number
        }
        with pytest.raises(ValidationError):
            SignUpSchema(**user_data)

class TestResetPasswordRequest:
    def test_password_mismatch(self):
        """Test that passwords must match"""
        data = {
            "email": "test@example.org",
            "new_password": "Password123",
            "confirm_password": "Password456"  # Different
        }
        with pytest.raises(ValidationError):
            ResetPasswordRequest(**data)

    def test_valid_reset_request(self):
        """Test that a valid reset request passes validation"""
        data = {
            "email": "test@example.org",
            "new_password": "Password123",
            "confirm_password": "Password123"
        }
        request = ResetPasswordRequest(**data)
        assert request.email == "test@example.org"
        assert request.new_password == "Password123"
        assert request.confirm_password == "Password123" 