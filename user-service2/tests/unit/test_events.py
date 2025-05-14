import pytest
from datetime import datetime
import uuid
from models.events import UserCreatedEvent, UserLoggedInEvent


class TestUserCreatedEvent:
    def test_create_user_event(self):
        """Test creating a user created event"""
        user_id = str(uuid.uuid4())
        email = "test@example.org"
        metadata = {"source": "website"}

        event = UserCreatedEvent.create(user_id=user_id, email=email, metadata=metadata)

        # Check basic fields
        assert event.event_type == "user.created"
        assert event.user_id == user_id
        assert event.email == email
        assert event.metadata == metadata
        assert event.version == "1.0"

        # Check generated fields
        assert uuid.UUID(event.event_id)  # Should be a valid UUID
        # Timestamp should be in ISO format and parse correctly
        datetime.fromisoformat(event.timestamp)

    def test_create_user_event_without_metadata(self):
        """Test creating a user event without metadata defaults to empty dict"""
        user_id = str(uuid.uuid4())
        email = "test@example.org"

        event = UserCreatedEvent.create(user_id=user_id, email=email)

        assert event.metadata == {}


class TestUserLoggedInEvent:
    def test_create_login_event(self):
        """Test creating a user login event"""
        user_id = str(uuid.uuid4())
        email = "test@example.org"
        metadata = {"ip": "127.0.0.1", "device": "web"}

        event = UserLoggedInEvent.create(
            user_id=user_id, email=email, metadata=metadata
        )

        # Check basic fields
        assert event.event_type == "user.logged_in"
        assert event.user_id == user_id
        assert event.email == email
        assert event.metadata == metadata

        # Check that timestamp and login_timestamp match
        assert event.timestamp == event.login_timestamp

        # Check generated fields
        assert uuid.UUID(event.event_id)
        datetime.fromisoformat(event.timestamp)
        datetime.fromisoformat(event.login_timestamp)
