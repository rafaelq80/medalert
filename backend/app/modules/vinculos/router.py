from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.usuarios.models import Usuario
from app.modules.vinculos.schemas import VinculoCreate, VinculoResponse
from app.modules.vinculos.service import create_vinculo, delete_vinculo, list_vinculos

router = APIRouter(
    tags=["Vínculos"],
    responses={
        401: {"description": "Token inválido ou expirado"},
        403: {"description": "Acesso negado"},
    },
)


@router.post("", response_model=VinculoResponse, status_code=status.HTTP_201_CREATED)
async def create_vinculo_endpoint(
    vinculo_data: VinculoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new vinculo between the current user and a paciente."""
    vinculo = await create_vinculo(current_user, vinculo_data, db)
    return VinculoResponse.model_validate(vinculo)


@router.get("", response_model=list[VinculoResponse])
async def list_vinculos_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active vinculos for the current user."""
    vinculos = await list_vinculos(current_user, db)
    return [VinculoResponse.model_validate(v) for v in vinculos]


@router.delete("/{vinculo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vinculo_endpoint(
    vinculo_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deactivate a vinculo (soft delete)."""
    await delete_vinculo(vinculo_id, current_user, db)
