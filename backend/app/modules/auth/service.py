from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.modules.auth.models import RefreshToken
from app.modules.auth.schemas import TokenResponse
from app.modules.usuarios.models import Usuario


async def authenticate_user(
    email: str,
    senha: str,
    push_token: str | None,
    db: AsyncSession,
) -> TokenResponse:
    """Authenticate user by email/password and return JWT tokens."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(senha, user.senha):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas",
        )

    if not user.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo",
        )

    # Create tokens
    token_data = {"sub": str(user.id)}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    # Save refresh token to DB
    expira_em = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token,
        revogado=False,
        expira_em=expira_em,
    )
    db.add(db_refresh_token)

    # Update push_token if provided
    if push_token is not None:
        user.push_token = push_token

    await db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


async def refresh_access_token(refresh_token: str, db: AsyncSession) -> dict:
    """Validate refresh token and return a new access token."""
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )

    # Check token exists in DB and is not revoked
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token == refresh_token,
            RefreshToken.revogado == False,
        )
    )
    db_token = result.scalar_one_or_none()

    if db_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )

    # Create new access token
    user_id = payload.get("sub")
    new_access_token = create_access_token({"sub": user_id})

    return {"access_token": new_access_token, "token_type": "bearer"}


async def logout(refresh_token: str, db: AsyncSession) -> None:
    """Revoke a refresh token."""
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    )
    db_token = result.scalar_one_or_none()

    if db_token is not None:
        db_token.revogado = True
        await db.commit()
