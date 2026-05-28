from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.agendas.schemas import AgendaCreate, AgendaResponse, AgendaUpdate
from app.modules.agendas.service import (
    create_agenda,
    delete_agenda,
    list_agendas,
    update_agenda,
)
from app.modules.usuarios.models import Usuario

router = APIRouter(
    tags=["Agendas"],
    responses={
        401: {"description": "Token inválido ou expirado"},
        403: {"description": "Acesso negado"},
    },
)


@router.post(
    "/medicamentos/{medicamento_id}/agendas",
    response_model=AgendaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agenda_endpoint(
    medicamento_id: int,
    agenda_data: AgendaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new agenda for a medicamento."""
    agenda = await create_agenda(medicamento_id, agenda_data, current_user, db)
    return AgendaResponse.model_validate(agenda)


@router.get(
    "/medicamentos/{medicamento_id}/agendas",
    response_model=list[AgendaResponse],
)
async def list_agendas_endpoint(
    medicamento_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active agendas for a medicamento."""
    agendas = await list_agendas(medicamento_id, current_user, db)
    return [AgendaResponse.model_validate(a) for a in agendas]


@router.put(
    "/agendas/{agenda_id}",
    response_model=AgendaResponse,
)
async def update_agenda_endpoint(
    agenda_id: int,
    update_data: AgendaUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an agenda."""
    agenda = await update_agenda(agenda_id, update_data, current_user, db)
    return AgendaResponse.model_validate(agenda)


@router.delete(
    "/agendas/{agenda_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_agenda_endpoint(
    agenda_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete an agenda."""
    await delete_agenda(agenda_id, current_user, db)
