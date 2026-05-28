from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.registros_tomada.schemas import (
    HistoricoAdesaoResponse,
    RegistroTomadaResponse,
)
from app.modules.registros_tomada.service import confirmar_tomada, list_registros_tomada
from app.modules.usuarios.models import Usuario

router = APIRouter(
    tags=["Registros de Tomada"],
    responses={
        401: {"description": "Token inválido ou expirado"},
        403: {"description": "Acesso negado — sem vínculo ativo"},
    },
)


@router.get(
    "/pacientes/{paciente_id}/registros-tomada",
    response_model=HistoricoAdesaoResponse,
)
async def list_registros_endpoint(
    paciente_id: int,
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    status: str | None = Query(None),
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List registros de tomada for a paciente with optional filters."""
    return await list_registros_tomada(
        paciente_id, current_user, db,
        data_inicio=data_inicio,
        data_fim=data_fim,
        status_filter=status,
    )


@router.put(
    "/registros-tomada/{registro_id}/confirmar",
    response_model=RegistroTomadaResponse,
)
async def confirm_registro_endpoint(
    registro_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm a registro de tomada."""
    return await confirmar_tomada(registro_id, current_user, db)
