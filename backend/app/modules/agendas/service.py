import logging
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
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
from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.repository import has_active_vinculo

logger = logging.getLogger(__name__)
LOCAL_TZ = ZoneInfo(settings.TIMEZONE)


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

    # Admin bypasses all vinculo checks
    if current_user.tipo == TipoUsuario.ADMIN:
        logger.info(f"Admin {current_user.id} acessando dados do paciente {medicamento.paciente_id}")
        return

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

    agenda = await create(agenda_data, db)

    # Generate today's registro_tomada immediately if applicable
    await _generate_today_registro(agenda, medicamento_id, db)

    return agenda


async def _generate_today_registro(
    agenda: Agenda, medicamento_id: int, db: AsyncSession
) -> None:
    """Generate the registro_tomada for today if the agenda applies."""
    from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
    from app.modules.registros_tomada.repository import exists_for_agenda_time

    today = datetime.now(LOCAL_TZ).date()

    # Check if agenda applies today
    if agenda.data_inicio > today:
        return
    if agenda.data_fim and agenda.data_fim < today:
        return

    from app.scheduler.jobs import _is_valid_day
    if not _is_valid_day(agenda, today):
        return

    data_hora_prevista = datetime.combine(today, agenda.horario, tzinfo=LOCAL_TZ)

    # Check if already exists
    exists = await exists_for_agenda_time(agenda.id, data_hora_prevista, db)
    if exists:
        return

    # Get medicamento to find paciente_id
    medicamento = await get_medicamento_by_id(medicamento_id, db)
    if medicamento is None or not medicamento.ativo:
        return

    registro = RegistroTomada(
        agenda_id=agenda.id,
        paciente_id=medicamento.paciente_id,
        data_hora_prevista=data_hora_prevista,
        status=StatusTomada.PENDENTE,
    )
    db.add(registro)
    await db.commit()
    logger.info(
        f"Generated immediate registro_tomada for new agenda {agenda.id} at {data_hora_prevista}"
    )


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
