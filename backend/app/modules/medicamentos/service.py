import logging
from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import now_local
from app.modules.medicamentos.models import Medicamento
from app.modules.medicamentos.repository import (
    create,
    deactivate,
    get_by_id,
    list_by_paciente,
    update,
)
from app.modules.medicamentos.schemas import MedicamentoCreate, MedicamentoUpdate
from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.repository import has_active_vinculo

logger = logging.getLogger(__name__)


async def _verify_access_to_paciente(
    current_user: Usuario, paciente_id: int, db: AsyncSession
) -> None:
    """Verify that the current user has access to the paciente's data."""
    # Admin bypasses all vinculo checks
    if current_user.tipo == TipoUsuario.ADMIN:
        logger.info(f"Admin {current_user.id} acessando dados do paciente {paciente_id}")
        return

    # User is the paciente themselves
    if current_user.id == paciente_id:
        return

    # User has an active vinculo with the paciente
    has_vinculo = await has_active_vinculo(current_user.id, paciente_id, db)
    if not has_vinculo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )


async def create_medicamento(
    paciente_id: int,
    data: MedicamentoCreate,
    current_user: Usuario,
    db: AsyncSession,
) -> Medicamento:
    """Create a new medicamento for a paciente."""
    await _verify_access_to_paciente(current_user, paciente_id, db)

    med_data = data.model_dump()
    med_data["paciente_id"] = paciente_id
    med_data["criado_por"] = current_user.id

    # Calculate data_proximo_retorno if necessita_retorno is True
    if data.necessita_retorno and data.intervalo_retorno_dias:
        med_data["data_proximo_retorno"] = (
            data.data_inicio_tratamento + timedelta(days=data.intervalo_retorno_dias)
        )

    return await create(med_data, db)


async def list_medicamentos(
    paciente_id: int, current_user: Usuario, db: AsyncSession
) -> list[Medicamento]:
    """List all active medicamentos for a paciente."""
    await _verify_access_to_paciente(current_user, paciente_id, db)
    return await list_by_paciente(paciente_id, db)


async def update_medicamento(
    med_id: int,
    data: MedicamentoUpdate,
    current_user: Usuario,
    db: AsyncSession,
) -> Medicamento:
    """Update a medicamento with audit fields."""
    medicamento = await get_by_id(med_id, db)

    if medicamento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicamento não encontrado",
        )

    await _verify_access_to_paciente(current_user, medicamento.paciente_id, db)

    update_data = data.model_dump(exclude_unset=True)
    update_data["atualizado_em"] = now_local()
    update_data["atualizado_por"] = current_user.id

    return await update(medicamento, update_data, db)


async def delete_medicamento(
    med_id: int, current_user: Usuario, db: AsyncSession
) -> None:
    """Soft delete a medicamento."""
    medicamento = await get_by_id(med_id, db)

    if medicamento is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicamento não encontrado",
        )

    await _verify_access_to_paciente(current_user, medicamento.paciente_id, db)
    await deactivate(medicamento, db)
