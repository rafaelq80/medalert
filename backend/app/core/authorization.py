"""
Centralized authorization helpers.
Eliminates duplication of _verify_access_to_paciente across services.
"""

import logging

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.repository import has_active_vinculo

logger = logging.getLogger(__name__)


async def verify_access_to_paciente(
    current_user: Usuario, paciente_id: int, db: AsyncSession
) -> None:
    """
    Verify that the current user has access to a paciente's data.
    Raises HTTP 403 if access is denied.

    Access is granted if:
    - User is ADMIN
    - User IS the paciente
    - User has an active vínculo with the paciente
    """
    if current_user.tipo == TipoUsuario.ADMIN:
        return

    if current_user.id == paciente_id:
        return

    has_vinculo = await has_active_vinculo(current_user.id, paciente_id, db)
    if not has_vinculo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )
