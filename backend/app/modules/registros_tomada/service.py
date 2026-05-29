import logging
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import LOCAL_TZ, now_local
from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
from app.modules.registros_tomada.repository import (
    confirm,
    get_by_id,
    list_by_paciente,
)
from app.modules.registros_tomada.schemas import (
    HistoricoAdesaoResponse,
    RegistroTomadaResponse,
)
from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.repository import has_active_vinculo

logger = logging.getLogger(__name__)


async def _verify_access_to_paciente(
    current_user: Usuario, paciente_id: int, db: AsyncSession
) -> None:
    """Verify that the current user has access to the paciente's data."""
    # Admin bypasses all vinculo checks
    if current_user.tipo == TipoUsuario.ADMIN:
        logger.info(f"Admin {current_user.id} acessando dados do paciente {paciente_id}")
        return

    if current_user.id == paciente_id:
        return

    has_vinculo = await has_active_vinculo(current_user.id, paciente_id, db)
    if not has_vinculo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado",
        )


async def list_registros_tomada(
    paciente_id: int,
    current_user: Usuario,
    db: AsyncSession,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    status_filter: str | None = None,
) -> HistoricoAdesaoResponse:
    """List registros de tomada with adherence calculation."""
    await _verify_access_to_paciente(current_user, paciente_id, db)

    registros = await list_by_paciente(
        paciente_id, db, data_inicio=data_inicio, data_fim=data_fim, status_filter=status_filter
    )

    total = len(registros)
    confirmados = sum(1 for r in registros if r.status == StatusTomada.CONFIRMADO)
    percentual_adesao = (confirmados / total * 100) if total > 0 else 0.0

    # Enrich registros with medicamento data
    enriched = []
    for r in registros:
        response = RegistroTomadaResponse.model_validate(r)
        # Load agenda → medicamento to get name/dosage/instructions/tolerancia
        med_info = await _get_medicamento_info(r.agenda_id, db)
        if med_info:
            response.medicamento_nome = med_info["nome"]
            response.medicamento_dosagem = med_info["dosagem"]
            response.medicamento_instrucoes = med_info["instrucoes"]
            response.tolerancia_minutos = med_info["tolerancia_minutos"]
        enriched.append(response)

    return HistoricoAdesaoResponse(
        registros=enriched,
        total=total,
        confirmados=confirmados,
        percentual_adesao=round(percentual_adesao, 2),
    )


async def _get_medicamento_info(agenda_id: int, db: AsyncSession) -> dict | None:
    """Get medicamento info and tolerancia from agenda_id."""
    from app.modules.agendas.models import Agenda
    from app.modules.medicamentos.models import Medicamento
    from sqlalchemy import select

    result = await db.execute(
        select(Agenda).where(Agenda.id == agenda_id)
    )
    agenda = result.scalar_one_or_none()
    if not agenda:
        return None

    med_result = await db.execute(
        select(Medicamento).where(Medicamento.id == agenda.medicamento_id)
    )
    medicamento = med_result.scalar_one_or_none()
    if not medicamento:
        return None

    return {
        "nome": medicamento.nome,
        "dosagem": medicamento.dosagem,
        "instrucoes": medicamento.instrucoes,
        "tolerancia_minutos": agenda.tolerancia_minutos,
    }


async def confirmar_tomada(
    registro_id: int,
    current_user: Usuario,
    db: AsyncSession,
) -> RegistroTomadaResponse:
    """Confirm a registro de tomada and notify responsáveis."""
    registro = await get_by_id(registro_id, db)

    if registro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Registro não encontrado",
        )

    await _verify_access_to_paciente(current_user, registro.paciente_id, db)

    # Cannot confirm if already CONFIRMADO or IGNORADO
    if registro.status in (StatusTomada.CONFIRMADO, StatusTomada.IGNORADO):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registro já foi confirmado ou ignorado",
        )

    registro = await confirm(registro, current_user.id, db)

    # Notify responsáveis/cuidadores about the confirmation
    await _notify_responsaveis_confirmacao(registro, db)

    return RegistroTomadaResponse.model_validate(registro)


async def _notify_responsaveis_confirmacao(
    registro: RegistroTomada, db: AsyncSession
) -> None:
    """Send confirmation notification to linked responsáveis/cuidadores."""
    import logging
    from sqlalchemy import select
    from app.modules.agendas.models import Agenda
    from app.modules.medicamentos.models import Medicamento
    from app.modules.notificacoes.models import Notificacao, TipoNotificacao
    from app.modules.vinculos.models import Vinculo
    from app.push.helpers import confirmacao_tomada_message
    from app.push.service import send_push

    logger = logging.getLogger(__name__)

    try:
        # Get medicamento info
        agenda_result = await db.execute(
            select(Agenda).where(Agenda.id == registro.agenda_id)
        )
        agenda = agenda_result.scalar_one_or_none()
        if not agenda:
            return

        med_result = await db.execute(
            select(Medicamento).where(Medicamento.id == agenda.medicamento_id)
        )
        medicamento = med_result.scalar_one_or_none()
        if not medicamento:
            return

        # Get paciente name
        paciente_result = await db.execute(
            select(Usuario).where(Usuario.id == registro.paciente_id)
        )
        paciente = paciente_result.scalar_one_or_none()
        if not paciente:
            return

        # Find responsáveis/cuidadores with active vinculo
        vinculo_result = await db.execute(
            select(Vinculo).where(
                Vinculo.paciente_id == registro.paciente_id,
                Vinculo.ativo == True,
            )
        )
        vinculos = list(vinculo_result.scalars().all())

        now = now_local()
        horario_str = ""
        if registro.data_hora_prevista:
            dt = registro.data_hora_prevista
            if dt.tzinfo is not None:
                dt = dt.astimezone(LOCAL_TZ)
            horario_str = dt.strftime("%H:%M")

        for vinculo in vinculos:
            resp_result = await db.execute(
                select(Usuario).where(Usuario.id == vinculo.responsavel_id)
            )
            responsavel = resp_result.scalar_one_or_none()
            if not responsavel or not responsavel.recebe_notificacoes:
                continue

            # Create notification
            notificacao = Notificacao(
                usuario_id=responsavel.id,
                registro_tomada_id=registro.id,
                tipo=TipoNotificacao.CONFIRMACAO,
                enviado_em=now,
            )
            db.add(notificacao)
            await db.commit()

            # Send push
            if responsavel.push_token:
                title, body = confirmacao_tomada_message(
                    paciente.nome, medicamento.nome, horario_str
                )
                await send_push(responsavel.push_token, title, body)

            logger.info(
                f"Sent CONFIRMACAO notification to responsavel {responsavel.id} "
                f"for registro {registro.id}"
            )

    except Exception as e:
        logger.error(f"Error notifying responsaveis about confirmation: {e}")
