from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.usuarios.models import Usuario


async def get_by_email(email: str, db: AsyncSession) -> Usuario | None:
    """Find a user by email address."""
    result = await db.execute(select(Usuario).where(Usuario.email == email))
    return result.scalar_one_or_none()


async def get_by_id(user_id: int, db: AsyncSession) -> Usuario | None:
    """Find a user by ID."""
    result = await db.execute(select(Usuario).where(Usuario.id == user_id))
    return result.scalar_one_or_none()


async def create(user_data: dict, db: AsyncSession) -> Usuario:
    """Create a new user and persist to database."""
    user = Usuario(**user_data)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update(user: Usuario, update_data: dict, db: AsyncSession) -> Usuario:
    """Update user fields and persist changes."""
    for key, value in update_data.items():
        if value is not None:
            setattr(user, key, value)
    await db.commit()
    await db.refresh(user)
    return user
