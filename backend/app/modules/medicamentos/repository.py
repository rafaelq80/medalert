from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.medicamentos.models import Categoria, Medicamento


async def create(data: dict, db: AsyncSession) -> Medicamento:
    """Create a new medicamento and persist to database."""
    medicamento = Medicamento(**data)
    db.add(medicamento)
    await db.commit()
    await db.refresh(medicamento)
    # Reload with categoria relationship
    return await get_by_id(medicamento.id, db)  # type: ignore[return-value]


async def list_by_paciente(paciente_id: int, db: AsyncSession) -> list[Medicamento]:
    """List all active medicamentos for a given paciente."""
    result = await db.execute(
        select(Medicamento)
        .options(selectinload(Medicamento.categoria))
        .where(
            Medicamento.paciente_id == paciente_id,
            Medicamento.ativo == True,
        )
    )
    return list(result.scalars().all())


async def get_by_id(med_id: int, db: AsyncSession) -> Medicamento | None:
    """Find a medicamento by ID."""
    result = await db.execute(
        select(Medicamento)
        .options(selectinload(Medicamento.categoria))
        .where(Medicamento.id == med_id)
    )
    return result.scalar_one_or_none()


async def update(medicamento: Medicamento, data: dict, db: AsyncSession) -> Medicamento:
    """Update medicamento fields and persist changes."""
    for key, value in data.items():
        setattr(medicamento, key, value)
    await db.commit()
    await db.refresh(medicamento)
    # Reload with categoria relationship
    return await get_by_id(medicamento.id, db)  # type: ignore[return-value]


async def deactivate(medicamento: Medicamento, db: AsyncSession) -> Medicamento:
    """Soft delete a medicamento by setting ativo=False."""
    medicamento.ativo = False
    await db.commit()
    await db.refresh(medicamento)
    return medicamento


# --- Categoria repository ---


async def list_all_categorias(db: AsyncSession) -> list[Categoria]:
    """List all categorias."""
    result = await db.execute(select(Categoria))
    return list(result.scalars().all())


async def get_categoria_by_id(categoria_id: int, db: AsyncSession) -> Categoria | None:
    """Find a categoria by ID."""
    result = await db.execute(select(Categoria).where(Categoria.id == categoria_id))
    return result.scalar_one_or_none()
