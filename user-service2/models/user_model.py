from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, Dict
import re
from enum import Enum
from datetime import datetime
import uuid


class UserRole(str, Enum):
    admin = "admin"
    staff = "staff"
    user = "user"


class DepartmentSchema(BaseModel):
    department_id: str
    department_name: str


class SignUpSchema(BaseModel):
    email: EmailStr
    password: str
    name: str
    surname: str
    role: Optional[UserRole] = UserRole.user
    phone_number: Optional[str] = None
    department_id: Optional[int] = None

    @validator("password")
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number")
        return v

    @validator("email")
    def validate_email(cls, email):
        if email.lower().endswith("@example.com"):
            raise ValueError("Please use a valid email address")
        return email

    @validator("phone_number")
    def validate_phone(cls, phone):
        if phone and not re.match(r"^\+?[0-9]{10,15}$", phone):
            raise ValueError("Invalid phone number format")
        return phone


class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    provider: Optional[str] = None


class UserSchema(BaseModel):
    id: str = Field(..., alias="_id")
    email: EmailStr
    firebase_uid: str
    name: str
    surname: str
    role: UserRole = UserRole.user
    phone_number: Optional[str] = None
    department_id: Optional[int] = None
    is_active: bool = True
    created_at: Optional[str] = Field(default_factory=lambda: str(datetime.now()))
    updated_at: Optional[str] = Field(default_factory=lambda: str(datetime.now()))
    provider: Optional[str] = None

    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
    confirm_password: str

    @validator("email")
    def validate_email(cls, email):
        if email.lower().endswith("@example.com"):
            raise ValueError("Please use a valid email address")
        return email

    @validator("new_password")
    def validate_new_password(cls, password):
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9]", password):
            raise ValueError("Password must contain at least one number")
        return password

    @validator("confirm_password")
    def validate_confirm_password(cls, confirm, values, **kwargs):
        new_password = values.get("new_password")
        if not new_password:
            raise ValueError("New password is missing")

        if confirm != new_password:
            raise ValueError("Passwords do not match")

        return confirm

    class Config:
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "new_password": "Password123",
                "confirm_password": "Password123",
            }
        }


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    surname: Optional[str] = None
    phone_number: Optional[str] = None

    @validator("phone_number")
    def validate_phone(cls, phone):
        if phone and not re.match(r"^\+?[0-9]{10,15}$", phone):
            raise ValueError("Invalid phone number format")
        return phone
