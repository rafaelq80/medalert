from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notificacoes.repository import get_by_id, list_by_usuario, mark_as_read
from app.modules.notificacoes.schemas import NotificacaoResponse
from app.modules.usuarios.models import Usuario


async def list_notificacoes(
    current_user: Usuario,
    db: AsyncSession,
    page: int = 1,
    size: int = 50,
) -> list[NotificacaoResponse]:
    """Return notifications for the authenticated user, enriched with context."""
    offset = (page - 1) * size
    notificacoes = await list_by_usuario(current_user.id, db, limit=size, offset=offset)

    enriched = []
    for n in notificacoes:
        response = NotificacaoResponse.model_validate(n)
        # Enrich with medicamento/paciente info if linked to a registro_tomada
        if n.registro_tomada_id:
            info = await _get_registro_context(n.registro_tomada_id, db)
            if info:
                response.medicamento_nome = info["medicamento_nome"]
                response.paciente_nome = info["paciente_nome"]
                response.horario_previsto = info["horario_previsto"]
        enriched.append(response)

    return enriched


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
    response = NotificacaoResponse.model_validate(notificacao)

    if notificacao.registro_tomada_id:
        info = await _get_registro_context(notificacao.registro_tomada_id, db)
        if info:
            response.medicamento_nome = info["medicamento_nome"]
            response.paciente_nome = info["paciente_nome"]
            response.horario_previsto = info["horario_previsto"]

    return response


async def _get_registro_context(registro_tomada_id: int, db: AsyncSession) -> dict | None:
    """Get medicamento name, paciente name, and scheduled time from a registro_tomada."""
    from app.modules.agendas.models import Agenda
    from app.modules.medicamentos.models import Medicamento
    from app.modules.registros_tomada.models import RegistroTomada

    reg_result = await db.execute(
        select(RegistroTomada).where(RegistroTomada.id == registro_tomada_id)
    )
    registro = reg_result.scalar_one_or_none()
    if not registro:
        return None

    agenda_result = await db.execute(
        select(Agenda).where(Agenda.id == registro.agenda_id)
    )
    agenda = agenda_result.scalar_one_or_none()
    if not agenda:
        return None

    med_result = await db.execute(
        select(Medicamento).where(Medicamento.id == agenda.medicamento_id)
    )
    medicamento = med_result.scalar_one_or_none()
    if not medicamento:
        return None

    paciente_result = await db.execute(
        select(Usuario).where(Usuario.id == registro.paciente_id)
    )
    paciente = paciente_result.scalar_one_or_none()

    horario_str = None
    if registro.data_hora_prevista:
        dt = registro.data_hora_prevista
        if dt.tzinfo is not None:
            from app.core.timezone import LOCAL_TZ
            dt = dt.astimezone(LOCAL_TZ)
        horario_str = dt.strftime("%H:%M")

    return {
        "medicamento_nome": medicamento.nome,
        "paciente_nome": paciente.nome if paciente else None,
        "horario_previsto": horario_str,
    }
