from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.notificacoes.schemas import NotificacaoResponse
from app.modules.notificacoes.service import list_notificacoes, marcar_lida
from app.modules.usuarios.models import Usuario

router = APIRouter(
    tags=["Notificações"],
    responses={401: {"description": "Token inválido ou expirado"}},
)


@router.get(
    "/notificacoes",
    response_model=list[NotificacaoResponse],
)
async def list_notificacoes_endpoint(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all notifications for the current user."""
    return await list_notificacoes(current_user, db)


@router.put(
    "/notificacoes/{notificacao_id}/lida",
    response_model=NotificacaoResponse,
)
async def mark_notificacao_as_read_endpoint(
    notificacao_id: int,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    return await marcar_lida(notificacao_id, current_user, db)
