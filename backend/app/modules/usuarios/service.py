from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.repository import create, get_by_email, update
from app.modules.usuarios.schemas import (
    PushTokenUpdate,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)


async def create_user(user_data: UsuarioCreate, db: AsyncSession) -> Usuario:
    """Create a new user after validating email uniqueness."""
    existing = await get_by_email(user_data.email, db)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado",
        )

    # Hash password before persisting
    data = user_data.model_dump()
    data["senha"] = hash_password(data["senha"])

    return await create(data, db)


async def get_profile(user: Usuario) -> UsuarioResponse:
    """Return the user profile as a response schema."""
    return UsuarioResponse.model_validate(user)


async def update_profile(
    user: Usuario, update_data: UsuarioUpdate, db: AsyncSession
) -> UsuarioResponse:
    """Update user profile fields."""
    data = update_data.model_dump(exclude_unset=True)
    updated_user = await update(user, data, db)
    return UsuarioResponse.model_validate(updated_user)


async def update_push_token(
    user: Usuario, push_token_data: PushTokenUpdate, db: AsyncSession
) -> None:
    """Update the user's push notification token."""
    user.push_token = push_token_data.push_token
    await db.commit()
