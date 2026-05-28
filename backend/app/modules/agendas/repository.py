from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agendas.models import Agenda


async def create(data: dict, db: AsyncSession) -> Agenda:
    """Create a new agenda and persist to database."""
    agenda = Agenda(**data)
    db.add(agenda)
    await db.commit()
    await db.refresh(agenda)
    return agenda


async def list_by_medicamento(medicamento_id: int, db: AsyncSession) -> list[Agenda]:
    """List all active agendas for a given medicamento."""
    result = await db.execute(
        select(Agenda).where(
            Agenda.medicamento_id == medicamento_id,
            Agenda.ativo == True,
        )
    )
    return list(result.scalars().all())


async def get_by_id(agenda_id: int, db: AsyncSession) -> Agenda | None:
    """Find an agenda by ID."""
    result = await db.execute(select(Agenda).where(Agenda.id == agenda_id))
    return result.scalar_one_or_none()


async def update(agenda: Agenda, data: dict, db: AsyncSession) -> Agenda:
    """Update agenda fields and persist changes."""
    for key, value in data.items():
        setattr(agenda, key, value)
    await db.commit()
    await db.refresh(agenda)
    return agenda


async def deactivate(agenda: Agenda, db: AsyncSession) -> Agenda:
    """Soft delete an agenda by setting ativo=False."""
    agenda.ativo = False
    await db.commit()
    await db.refresh(agenda)
    return agenda
