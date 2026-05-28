from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.modules.auth.schemas import LoginRequest, RefreshRequest, TokenResponse
from app.modules.auth.service import authenticate_user, logout, refresh_access_token

router = APIRouter(
    tags=["Auth"],
    responses={401: {"description": "Credenciais inválidas"}},
)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate user and return access/refresh tokens."""
    return await authenticate_user(
        email=request.email,
        senha=request.senha,
        push_token=request.push_token,
        db=db,
    )


@router.post("/refresh")
async def refresh(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Get a new access token using a valid refresh token."""
    return await refresh_access_token(
        refresh_token=request.refresh_token,
        db=db,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_user(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Revoke a refresh token (logout)."""
    await logout(refresh_token=request.refresh_token, db=db)
