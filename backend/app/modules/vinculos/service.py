import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.models import Vinculo
from app.modules.vinculos.repository import (
    create,
    deactivate,
    get_active_by_pair,
    get_by_id,
    list_by_user,
)
from app.modules.vinculos.schemas import VinculoCreate

logger = logging.getLogger(__name__)


async def create_vinculo(
    current_user: Usuario, vinculo_data: VinculoCreate, db: AsyncSession
) -> Vinculo:
    """Create a new vinculo after validating permissions and uniqueness."""
    # Admin can create vinculos between any users
    if current_user.tipo == TipoUsuario.ADMIN:
        logger.info(f"Admin {current_user.id} criando vínculo para paciente {vinculo_data.paciente_id}")
    elif current_user.tipo not in (TipoUsuario.RESPONSAVEL, TipoUsuario.CUIDADOR):
        # Only RESPONSAVEL or CUIDADOR can create vinculos
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas responsáveis ou cuidadores podem criar vínculos",
        )

    # Check if active vinculo already exists for this pair
    existing = await get_active_by_pair(
        current_user.id, vinculo_data.paciente_id, db
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vínculo já existe",
        )

    return await create(current_user.id, vinculo_data.paciente_id, db)


async def list_vinculos(current_user: Usuario, db: AsyncSession) -> list[Vinculo]:
    """List all active vinculos for the current user."""
    return await list_by_user(current_user.id, db)


async def delete_vinculo(
    vinculo_id: int, current_user: Usuario, db: AsyncSession
) -> None:
    """Deactivate a vinculo (soft delete) after verifying ownership."""
    vinculo = await get_by_id(vinculo_id, db)

    if vinculo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vínculo não encontrado",
        )

    # Admin bypasses ownership check
    if current_user.tipo == TipoUsuario.ADMIN:
        logger.info(f"Admin {current_user.id} removendo vínculo {vinculo_id}")
        await deactivate(vinculo, db)
        return

    # Verify ownership: user must be the responsavel or paciente
    if vinculo.responsavel_id != current_user.id and vinculo.paciente_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )

    await deactivate(vinculo, db)
