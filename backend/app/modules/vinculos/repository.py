from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.vinculos.models import Vinculo


async def create(responsavel_id: int, paciente_id: int, db: AsyncSession) -> Vinculo:
    """Create a new vinculo between responsavel and paciente."""
    vinculo = Vinculo(
        responsavel_id=responsavel_id,
        paciente_id=paciente_id,
        data_inicio=date.today(),
        ativo=True,
    )
    db.add(vinculo)
    await db.commit()
    # Reload with paciente relationship
    result = await db.execute(
        select(Vinculo)
        .options(selectinload(Vinculo.paciente))
        .where(Vinculo.id == vinculo.id)
    )
    return result.scalar_one()


async def get_active_by_pair(
    responsavel_id: int, paciente_id: int, db: AsyncSession
) -> Vinculo | None:
    """Find an active vinculo for a given responsavel-paciente pair."""
    result = await db.execute(
        select(Vinculo).where(
            Vinculo.responsavel_id == responsavel_id,
            Vinculo.paciente_id == paciente_id,
            Vinculo.ativo == True,
        )
    )
    return result.scalar_one_or_none()


async def list_by_user(user_id: int, db: AsyncSession) -> list[Vinculo]:
    """List all active vinculos where user is either responsavel or paciente."""
    result = await db.execute(
        select(Vinculo)
        .options(selectinload(Vinculo.paciente))
        .where(
            or_(
                Vinculo.responsavel_id == user_id,
                Vinculo.paciente_id == user_id,
            ),
            Vinculo.ativo == True,
        )
    )
    return list(result.scalars().all())


async def get_by_id(vinculo_id: int, db: AsyncSession) -> Vinculo | None:
    """Find a vinculo by ID."""
    result = await db.execute(select(Vinculo).where(Vinculo.id == vinculo_id))
    return result.scalar_one_or_none()


async def deactivate(vinculo: Vinculo, db: AsyncSession) -> Vinculo:
    """Soft delete a vinculo by setting data_fim and ativo=False."""
    vinculo.data_fim = date.today()
    vinculo.ativo = False
    await db.commit()
    await db.refresh(vinculo)
    return vinculo


async def has_active_vinculo(
    responsavel_id: int, paciente_id: int, db: AsyncSession
) -> bool:
    """Check if an active vinculo exists between responsavel and paciente."""
    vinculo = await get_active_by_pair(responsavel_id, paciente_id, db)
    return vinculo is not None
