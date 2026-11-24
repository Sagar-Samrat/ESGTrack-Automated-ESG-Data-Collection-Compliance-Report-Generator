from fastapi import APIRouter, Depends, status
from typing import Dict, Any
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse
from app.services.auth_service import register_user, authenticate_user, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest):
    return register_user(req)

@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest):
    return authenticate_user(req)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(
        user_id=user["user_id"],
        name=user["name"],
        email=user["email"],
        role=user.get("role", "member"),
        company_id=user["company_id"],
        created_at=user["created_at"]
    )

