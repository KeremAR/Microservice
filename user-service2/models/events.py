from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
import uuid

class BaseEvent(BaseModel):
    """Base class for all domain events"""
    event_id: str
    event_type: str
    timestamp: str
    version: str = "1.0"
    
    class Config:
        from_attributes = True

class UserCreatedEvent(BaseEvent):
    """Event emitted when a new user is created"""
    event_type: str = "user.created"
    user_id: str
    email: str
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def create(cls, user_id: str, email: str, metadata: Optional[Dict[str, Any]] = None):
        """Factory method to create a new UserCreatedEvent"""
        return cls(
            event_id=str(uuid.uuid4()),
            timestamp=datetime.utcnow().isoformat(),
            user_id=user_id,
            email=email,
            metadata=metadata or {}
        )

class UserLoggedInEvent(BaseEvent):
    """Event emitted when a user logs in"""
    event_type: str = "user.logged_in"
    user_id: str
    email: str
    login_timestamp: str
    metadata: Optional[Dict[str, Any]] = None
    
    @classmethod
    def create(cls, user_id: str, email: str, metadata: Optional[Dict[str, Any]] = None):
        """Factory method to create a new UserLoggedInEvent"""
        now = datetime.utcnow().isoformat()
        return cls(
            event_id=str(uuid.uuid4()),
            timestamp=now,
            user_id=user_id,
            email=email,
            login_timestamp=now,
            metadata=metadata or {}
        ) 