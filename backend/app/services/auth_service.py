import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_users_collection, get_companies_collection, get_audit_logs_collection
from app.utils.security import hash_password, verify_password, create_access_token, decode_access_token
from app.schemas.auth import UserRegisterRequest, UserLoginRequest, TokenResponse, UserResponse

security_bearer = HTTPBearer(auto_error=False)

def register_user(data: UserRegisterRequest) -> TokenResponse:
    users_col = get_users_collection()
    companies_col = get_companies_collection()

    existing_user = users_col.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address is already registered."
        )

    company_id = f"comp_{uuid.uuid4().hex[:12]}"
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)

    # Create company record
    company_doc = {
        "company_id": company_id,
        "company_name": data.company_name.strip(),
        "industry": "General Corporate",
        "country": "United States",
        "reporting_year": 2024,
        "created_at": now
    }
    companies_col.insert_one(company_doc)

    # Create user record
    password_hash = hash_password(data.password)
    user_doc = {
        "user_id": user_id,
        "name": data.name.strip(),
        "email": data.email.lower().strip(),
        "password_hash": password_hash,
        "role": "admin",
        "company_id": company_id,
        "created_at": now
    }
    users_col.insert_one(user_doc)

    # Audit log
    get_audit_logs_collection().insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "company_id": company_id,
        "user_id": user_id,
        "action": "USER_REGISTERED",
        "timestamp": now
    })

    # Create JWT
    token = create_access_token({
        "sub": user_id,
        "email": user_doc["email"],
        "name": user_doc["name"],
        "role": user_doc["role"],
        "company_id": company_id
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user_id,
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        company_id=company_id,
        company_name=company_doc["company_name"]
    )

def authenticate_user(data: UserLoginRequest) -> TokenResponse:
    users_col = get_users_collection()
    companies_col = get_companies_collection()

    user = users_col.find_one({"email": data.email.lower().strip()})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    company = companies_col.find_one({"company_id": user["company_id"]})
    company_name = company["company_name"] if company else "Default Organization"

    token = create_access_token({
        "sub": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "member"),
        "company_id": user["company_id"]
    })

    # Log action
    get_audit_logs_collection().insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:12]}",
        "company_id": user["company_id"],
        "user_id": user["user_id"],
        "action": "USER_LOGIN",
        "timestamp": datetime.now(timezone.utc)
    })

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user["user_id"],
        email=user["email"],
        name=user["name"],
        role=user.get("role", "member"),
        company_id=user["company_id"],
        company_name=company_name
    )

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required."
        )

    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token."
        )

    users_col = get_users_collection()
    user = users_col.find_one({"user_id": payload["sub"]})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account not found."
        )

    return user

def get_current_company_id(current_user: Dict[str, Any] = Depends(get_current_user)) -> str:
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is not associated with any registered company."
        )
    return company_id

