from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agendas.models import Agenda
from app.modules.agendas.repository import (
    create,
    deactivate,
    get_by_id,
    list_by_medicamento,
    update,
)
from app.modules.agendas.schemas import AgendaCreate, AgendaUpdate
from app.modules.medicamentos.repository import get_by_id as get_medicamento_by_id
from app.modules.usuarios.models import Usuario
from app.modules.vinculos.repository import has_active_vinculo


async def _verify_access_to_medicamento(
    current_user: Usuario, medicamento_id: int, db: AsyncSession
) -> None:
    """Verify that the current user has access to the medicamento."""
    medicamento = await get_medicamento_by_id(medicamento_id, db)

    if medicamento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicamento não encontrado",
        )

    # User is the paciente themselves
    if current_user.id == medicamento.paciente_id:
        return

    # User has an active vinculo with the paciente
    has_vinculo = await has_active_vinculo(
        current_user.id, medicamento.paciente_id, db
    )
    if not has_vinculo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )


async def create_agenda(
    medicamento_id: int,
    data: AgendaCreate,
    current_user: Usuario,
    db: AsyncSession,
) -> Agenda:
    """Create a new agenda for a medicamento."""
    await _verify_access_to_medicamento(current_user, medicamento_id, db)

    agenda_data = data.model_dump()
    agenda_data["medicamento_id"] = medicamento_id

    return await create(agenda_data, db)


async def list_agendas(
    medicamento_id: int, current_user: Usuario, db: AsyncSession
) -> list[Agenda]:
    """List all active agendas for a medicamento."""
    await _verify_access_to_medicamento(current_user, medicamento_id, db)
    return await list_by_medicamento(medicamento_id, db)


async def update_agenda(
    agenda_id: int,
    data: AgendaUpdate,
    current_user: Usuario,
    db: AsyncSession,
) -> Agenda:
    """Update an agenda."""
    agenda = await get_by_id(agenda_id, db)

    if agenda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agenda não encontrada",
        )

    await _verify_access_to_medicamento(current_user, agenda.medicamento_id, db)

    update_data = data.model_dump(exclude_unset=True)
    return await update(agenda, update_data, db)


async def delete_agenda(
    agenda_id: int, current_user: Usuario, db: AsyncSession
) -> None:
    """Soft delete an agenda."""
    agenda = await get_by_id(agenda_id, db)

    if agenda is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agenda não encontrada",
        )

    await _verify_access_to_medicamento(current_user, agenda.medicamento_id, db)
    await deactivate(agenda, db)
