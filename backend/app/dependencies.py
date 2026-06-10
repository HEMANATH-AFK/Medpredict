"""FastAPI dependency injection — get_current_user, role guards."""

from __future__ import annotations
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError

from app.utils.auth import decode_token
from app.db.mongo import users_col
from bson import ObjectId

bearer_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        if not user_id:
            print("[WARN] Token sub field missing")
            raise credentials_exception
    except JWTError as e:
        print(f"[WARN] Token decode failed: {e}")
        raise credentials_exception

    user = await users_col().find_one({"_id": ObjectId(user_id)})
    if not user:
        print(f"[WARN] User not found in DB for sub {user_id}")
        raise credentials_exception
    return user


def require_role(*roles: str):
    async def _guard(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role required: {', '.join(roles)}",
            )
        return current_user
    return _guard
