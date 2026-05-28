from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notificacoes.repository import get_by_id, list_by_usuario, mark_as_read
from app.modules.notificacoes.schemas import NotificacaoResponse
from app.modules.usuarios.models import Usuario


async def list_notificacoes(
    current_user: Usuario,
    db: AsyncSession,
) -> list[NotificacaoResponse]:
    """Return only notifications for the authenticated user."""
    notificacoes = await list_by_usuario(current_user.id, db)
    return [NotificacaoResponse.model_validate(n) for n in notificacoes]


async def marcar_lida(
    notificacao_id: int,
    current_user: Usuario,
    db: AsyncSession,
) -> NotificacaoResponse:
    """Mark a notification as read. Verifies ownership."""
    notificacao = await get_by_id(notificacao_id, db)

    if notificacao is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificação não encontrada",
        )

    if notificacao.usuario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )

    notificacao = await mark_as_read(notificacao, db)
    return NotificacaoResponse.model_validate(notificacao)
