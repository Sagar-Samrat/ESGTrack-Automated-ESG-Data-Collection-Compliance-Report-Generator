from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    company_name: str = Field(..., min_length=2, max_length=100)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str
    role: str
    company_id: str
    company_name: str

class UserResponse(BaseModel):
    user_id: str
    name: str
    email: str
    role: str
    company_id: str
    created_at: datetime

