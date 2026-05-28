from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.medicamentos.repository import list_all_categorias
from app.modules.medicamentos.schemas import CategoriaResponse
from app.modules.usuarios.models import Usuario

router = APIRouter(
    tags=["Categorias"],
    responses={401: {"description": "Token inválido ou expirado"}},
)


@router.get("", response_model=list[CategoriaResponse])
async def list_categorias(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all medication categories."""
    categorias = await list_all_categorias(db)
    return [CategoriaResponse.model_validate(c) for c in categorias]
