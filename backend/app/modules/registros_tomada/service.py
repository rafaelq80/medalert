from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
from app.modules.registros_tomada.repository import (
    confirm,
    get_by_id,
    list_by_paciente,
)
from app.modules.registros_tomada.schemas import (
    HistoricoAdesaoResponse,
    RegistroTomadaResponse,
)
from app.modules.usuarios.models import Usuario
from app.modules.vinculos.repository import has_active_vinculo


async def _verify_access_to_paciente(
    current_user: Usuario, paciente_id: int, db: AsyncSession
) -> None:
    """Verify that the current user has access to the paciente's data."""
    if current_user.id == paciente_id:
        return

    has_vinculo = await has_active_vinculo(current_user.id, paciente_id, db)
    if not has_vinculo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )


async def list_registros_tomada(
    paciente_id: int,
    current_user: Usuario,
    db: AsyncSession,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    status_filter: str | None = None,
) -> HistoricoAdesaoResponse:
    """List registros de tomada with adherence calculation."""
    await _verify_access_to_paciente(current_user, paciente_id, db)

    registros = await list_by_paciente(
        paciente_id, db, data_inicio=data_inicio, data_fim=data_fim, status_filter=status_filter
    )

    total = len(registros)
    confirmados = sum(1 for r in registros if r.status == StatusTomada.CONFIRMADO)
    percentual_adesao = (confirmados / total * 100) if total > 0 else 0.0

    return HistoricoAdesaoResponse(
        registros=[RegistroTomadaResponse.model_validate(r) for r in registros],
        total=total,
        confirmados=confirmados,
        percentual_adesao=round(percentual_adesao, 2),
    )


async def confirmar_tomada(
    registro_id: int,
    current_user: Usuario,
    db: AsyncSession,
) -> RegistroTomadaResponse:
    """Confirm a registro de tomada."""
    registro = await get_by_id(registro_id, db)

    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado",
        )

    await _verify_access_to_paciente(current_user, registro.paciente_id, db)

    # Cannot confirm if already CONFIRMADO or IGNORADO
    if registro.status in (StatusTomada.CONFIRMADO, StatusTomada.IGNORADO):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registro já foi confirmado ou ignorado",
        )

    registro = await confirm(registro, current_user.id, db)
    return RegistroTomadaResponse.model_validate(registro)
