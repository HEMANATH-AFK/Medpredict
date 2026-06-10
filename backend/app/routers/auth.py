"""Auth router — register, login, refresh endpoints."""

from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Request
from bson import ObjectId

from app.db.mongo import users_col
from app.models.schemas import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest
from app.utils.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from jose import JWTError

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=dict, status_code=201)
async def register(body: RegisterRequest):
    col = users_col()
    if await col.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_doc = {
        "email":         body.email,
        "password_hash": hash_password(body.password),
        "role":          body.role,
        "profile":       {"name": body.name},
        "created_at":    datetime.now(timezone.utc),
        "last_login":    None,
    }
    result  = await col.insert_one(user_doc)
    user_id = str(result.inserted_id)

    return {"message": "Account created", "user_id": user_id, "role": body.role}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request):
    col  = users_col()
    user = await col.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    user_id = str(user["_id"])
    token_data = {"sub": user_id, "role": user["role"], "email": user["email"]}

    access_token  = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Update last login
    await col.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}},
    )

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        token_data = {"sub": payload["sub"], "role": payload["role"], "email": payload["email"]}
        return TokenResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
        )
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")


@router.get("/me", response_model=dict)
async def get_me(request: Request):
    """Get current user profile (uses dependency via middleware)."""
    from app.dependencies import get_current_user
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
    # This is called via dependency in practice; here as convenience
    return {"message": "Use Authorization header with Bearer token"}
