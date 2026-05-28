from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.medicamentos.schemas import (
    MedicamentoCreate,
    MedicamentoResponse,
    MedicamentoUpdate,
)
from app.modules.medicamentos.service import (
    create_medicamento,
    delete_medicamento,
    list_medicamentos,
    update_medicamento,
)
from app.modules.usuarios.models import Usuario

router = APIRouter(
    tags=["Medicamentos"],
    responses={
        401: {"description": "Token inválido ou expirado"},
        403: {"description": "Acesso negado"},
    },
)


@router.post(
    "/pacientes/{paciente_id}/medicamentos",
    response_model=MedicamentoResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_medicamento_endpoint(
    paciente_id: int,
    med_data: MedicamentoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new medicamento for a paciente."""
    medicamento = await create_medicamento(paciente_id, med_data, current_user, db)
    return MedicamentoResponse.model_validate(medicamento)


@router.get(
    "/pacientes/{paciente_id}/medicamentos",
    response_model=list[MedicamentoResponse],
)
async def list_medicamentos_endpoint(
    paciente_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active medicamentos for a paciente."""
    medicamentos = await list_medicamentos(paciente_id, current_user, db)
    return [MedicamentoResponse.model_validate(m) for m in medicamentos]


@router.put(
    "/medicamentos/{med_id}",
    response_model=MedicamentoResponse,
)
async def update_medicamento_endpoint(
    med_id: int,
    update_data: MedicamentoUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a medicamento."""
    medicamento = await update_medicamento(med_id, update_data, current_user, db)
    return MedicamentoResponse.model_validate(medicamento)


@router.delete(
    "/medicamentos/{med_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_medicamento_endpoint(
    med_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Soft delete a medicamento."""
    await delete_medicamento(med_id, current_user, db)
