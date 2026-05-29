"""
Scheduled jobs for MedAlert.
All jobs create their own AsyncSession since they run outside request context.
All jobs are wrapped in try/except to never crash the scheduler.
"""

import logging
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)
LOCAL_TZ = ZoneInfo(settings.TIMEZONE)


async def job_gerar_registros_tomada():
    """
    Runs every 5 minutes.
    Scans active agendas and creates REGISTRO_TOMADA with status=PENDENTE
    for all scheduled times TODAY that don't have an existing record.
    Creates NOTIFICACAO type=LEMBRETE and sends push notification to the patient
    only when the scheduled time is within the next 5 minutes.
    """
    try:
        async with AsyncSessionLocal() as db:
            from app.modules.agendas.models import Agenda
            from app.modules.medicamentos.models import Medicamento
            from app.modules.notificacoes.models import Notificacao, TipoNotificacao
            from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
            from app.modules.registros_tomada.repository import exists_for_agenda_time
            from app.modules.usuarios.models import Usuario
            from app.push.helpers import lembrete_message
            from app.push.service import send_push

            now = datetime.now(LOCAL_TZ)
            notification_window_end = now + timedelta(minutes=5)
            today = now.date()

            # Find all active agendas where data_inicio <= today
            result = await db.execute(
                select(Agenda).where(
                    Agenda.ativo == True,
                    Agenda.data_inicio <= today,
                )
            )
            agendas = list(result.scalars().all())

            for agenda in agendas:
                try:
                    # Skip if agenda has ended
                    if agenda.data_fim and agenda.data_fim < today:
                        continue

                    # Check if today is a valid day for this agenda
                    if not _is_valid_day(agenda, today):
                        continue

                    # Calculate the data_hora_prevista for today (local timezone)
                    data_hora_prevista = datetime.combine(
                        today, agenda.horario, tzinfo=LOCAL_TZ
                    )

                    # Check if registro already exists for this agenda and time
                    exists = await exists_for_agenda_time(
                        agenda.id, data_hora_prevista, db
                    )
                    if exists:
                        continue

                    # Get medicamento to find paciente
                    med_result = await db.execute(
                        select(Medicamento).where(
                            Medicamento.id == agenda.medicamento_id
                        )
                    )
                    medicamento = med_result.scalar_one_or_none()
                    if medicamento is None or not medicamento.ativo:
                        continue

                    # Create registro de tomada for today
                    registro = RegistroTomada(
                        agenda_id=agenda.id,
                        paciente_id=medicamento.paciente_id,
                        data_hora_prevista=data_hora_prevista,
                        status=StatusTomada.PENDENTE,
                    )
                    db.add(registro)
                    await db.flush()

                    # Only send push notification if within the 5-min window
                    should_notify = (
                        data_hora_prevista >= now
                        and data_hora_prevista <= notification_window_end
                    )

                    if should_notify:
                        # Create NOTIFICACAO type=LEMBRETE for the paciente
                        notificacao = Notificacao(
                            usuario_id=medicamento.paciente_id,
                            registro_tomada_id=registro.id,
                            tipo=TipoNotificacao.LEMBRETE,
                            enviado_em=now,
                        )
                        db.add(notificacao)

                    await db.commit()

                    # Send push notification to paciente if within window
                    if should_notify:
                        paciente_result = await db.execute(
                            select(Usuario).where(
                                Usuario.id == medicamento.paciente_id
                            )
                        )
                        paciente = paciente_result.scalar_one_or_none()

                        if paciente and paciente.push_token:
                            horario_str = agenda.horario.strftime("%H:%M")
                            title, body = lembrete_message(
                                medicamento.nome, horario_str
                            )
                            await send_push(paciente.push_token, title, body)

                    logger.info(
                        f"Created registro_tomada for agenda {agenda.id} "
                        f"at {data_hora_prevista}"
                        f"{' (with notification)' if should_notify else ''}"
                    )

                except Exception as e:
                    logger.error(f"Error processing agenda {agenda.id}: {e}")
                    await db.rollback()
                    continue

    except Exception as e:
        logger.error(f"Error in job_gerar_registros_tomada: {e}")


async def job_verificar_atrasos():
    """
    Runs every 2 minutes.
    Finds REGISTRO_TOMADA with status=PENDENTE where
    data_hora_prevista + tolerancia_minutos < now.
    Updates status to ATRASADO.
    Finds responsáveis/cuidadores with active vinculo and recebe_notificacoes=TRUE.
    Creates NOTIFICACAO type=FALHA_TOMADA for each eligible responsavel.
    Sends push to each eligible responsavel.
    """
    try:
        async with AsyncSessionLocal() as db:
            from app.modules.agendas.models import Agenda
            from app.modules.medicamentos.models import Medicamento
            from app.modules.notificacoes.models import Notificacao, TipoNotificacao
            from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
            from app.modules.usuarios.models import Usuario
            from app.modules.vinculos.models import Vinculo
            from app.push.helpers import falha_tomada_message
            from app.push.service import send_push

            now = datetime.now(LOCAL_TZ)

            # Find pending registros joined with their agenda
            result = await db.execute(
                select(RegistroTomada).where(
                    RegistroTomada.status == StatusTomada.PENDENTE
                )
            )
            registros = list(result.scalars().all())

            for registro in registros:
                try:
                    # Get the agenda to check tolerancia_minutos
                    agenda_result = await db.execute(
                        select(Agenda).where(Agenda.id == registro.agenda_id)
                    )
                    agenda = agenda_result.scalar_one_or_none()
                    if agenda is None:
                        continue

                    # Check if tolerance window has expired
                    deadline = registro.data_hora_prevista + timedelta(
                        minutes=agenda.tolerancia_minutos
                    )
                    if now <= deadline:
                        continue

                    # Update status to ATRASADO
                    registro.status = StatusTomada.ATRASADO
                    await db.commit()

                    # Get medicamento info for notification
                    med_result = await db.execute(
                        select(Medicamento).where(
                            Medicamento.id == agenda.medicamento_id
                        )
                    )
                    medicamento = med_result.scalar_one_or_none()
                    if medicamento is None:
                        continue

                    # Get paciente info
                    paciente_result = await db.execute(
                        select(Usuario).where(Usuario.id == registro.paciente_id)
                    )
                    paciente = paciente_result.scalar_one_or_none()
                    if paciente is None:
                        continue

                    # Find responsáveis/cuidadores with active vinculo
                    vinculo_result = await db.execute(
                        select(Vinculo).where(
                            Vinculo.paciente_id == registro.paciente_id,
                            Vinculo.ativo == True,
                        )
                    )
                    vinculos = list(vinculo_result.scalars().all())

                    for vinculo in vinculos:
                        try:
                            resp_result = await db.execute(
                                select(Usuario).where(
                                    Usuario.id == vinculo.responsavel_id
                                )
                            )
                            responsavel = resp_result.scalar_one_or_none()

                            # Only notify if recebe_notificacoes=TRUE
                            if (
                                responsavel is None
                                or not responsavel.recebe_notificacoes
                            ):
                                continue

                            # Create NOTIFICACAO type=FALHA_TOMADA
                            notificacao = Notificacao(
                                usuario_id=responsavel.id,
                                registro_tomada_id=registro.id,
                                tipo=TipoNotificacao.FALHA_TOMADA,
                                enviado_em=now,
                            )
                            db.add(notificacao)
                            await db.commit()

                            # Send push notification
                            if responsavel.push_token:
                                horario_str = agenda.horario.strftime("%H:%M")
                                title, body = falha_tomada_message(
                                    paciente.nome, medicamento.nome, horario_str
                                )
                                await send_push(responsavel.push_token, title, body)

                        except Exception as e:
                            logger.error(
                                f"Error notifying responsavel "
                                f"{vinculo.responsavel_id}: {e}"
                            )
                            await db.rollback()
                            continue

                    logger.info(f"Marked registro {registro.id} as ATRASADO")

                except Exception as e:
                    logger.error(f"Error processing registro {registro.id}: {e}")
                    await db.rollback()
                    continue

    except Exception as e:
        logger.error(f"Error in job_verificar_atrasos: {e}")


async def job_marcar_ignorados():
    """
    Runs every 5 minutes.
    Finds REGISTRO_TOMADA with status=ATRASADO where
    data_hora_prevista + 2h < now. Updates status to IGNORADO.
    """
    try:
        async with AsyncSessionLocal() as db:
            from app.modules.registros_tomada.models import RegistroTomada, StatusTomada

            now = datetime.now(LOCAL_TZ)
            two_hours_ago = now - timedelta(hours=2)

            result = await db.execute(
                select(RegistroTomada).where(
                    RegistroTomada.status == StatusTomada.ATRASADO,
                    RegistroTomada.data_hora_prevista < two_hours_ago,
                )
            )
            registros = list(result.scalars().all())

            for registro in registros:
                try:
                    registro.status = StatusTomada.IGNORADO
                    await db.commit()
                    logger.info(f"Marked registro {registro.id} as IGNORADO")
                except Exception as e:
                    logger.error(
                        f"Error marking registro {registro.id} as IGNORADO: {e}"
                    )
                    await db.rollback()
                    continue

            if registros:
                logger.info(
                    f"job_marcar_ignorados: marked {len(registros)} "
                    f"registros as IGNORADO"
                )

    except Exception as e:
        logger.error(f"Error in job_marcar_ignorados: {e}")


async def job_alertas_retorno_medico():
    """
    Runs daily at 06:00 UTC.
    Finds medications with necessita_retorno=TRUE, ativo=TRUE,
    data_proximo_retorno <= today + 7 days.
    Checks if NOTIFICACAO type=RETORNO_MEDICO exists in last 7 days (idempotency).
    If not, finds responsavel with active vinculo.
    Creates NOTIFICACAO type=RETORNO_MEDICO and sends push to responsavel.
    """
    try:
        async with AsyncSessionLocal() as db:
            from app.modules.medicamentos.models import Medicamento
            from app.modules.notificacoes.models import Notificacao, TipoNotificacao
            from app.modules.notificacoes.repository import get_recent_retorno_medico
            from app.modules.usuarios.models import Usuario
            from app.modules.vinculos.models import Vinculo
            from app.push.helpers import retorno_medico_message
            from app.push.service import send_push

            now = datetime.now(LOCAL_TZ)
            today = now.date()
            seven_days_ahead = today + timedelta(days=7)

            # Find medicamentos that need return appointment soon
            result = await db.execute(
                select(Medicamento).where(
                    Medicamento.necessita_retorno == True,
                    Medicamento.ativo == True,
                    Medicamento.data_proximo_retorno != None,
                    Medicamento.data_proximo_retorno <= seven_days_ahead,
                )
            )
            medicamentos = list(result.scalars().all())

            for medicamento in medicamentos:
                try:
                    # Check if notification was already sent in last 7 days
                    recent = await get_recent_retorno_medico(
                        medicamento.id, 7, db
                    )
                    if recent is not None:
                        continue

                    # Get paciente info for notification message
                    paciente_result = await db.execute(
                        select(Usuario).where(
                            Usuario.id == medicamento.paciente_id
                        )
                    )
                    paciente = paciente_result.scalar_one_or_none()
                    if paciente is None:
                        continue

                    # Find responsáveis linked to this paciente
                    vinculo_result = await db.execute(
                        select(Vinculo).where(
                            Vinculo.paciente_id == medicamento.paciente_id,
                            Vinculo.ativo == True,
                        )
                    )
                    vinculos = list(vinculo_result.scalars().all())

                    if not vinculos:
                        # No responsavel linked, notify paciente directly
                        notificacao = Notificacao(
                            usuario_id=paciente.id,
                            tipo=TipoNotificacao.RETORNO_MEDICO,
                            enviado_em=now,
                        )
                        db.add(notificacao)
                        await db.commit()

                        if paciente.push_token:
                            data_retorno_str = (
                                medicamento.data_proximo_retorno.strftime("%d/%m/%Y")
                            )
                            title, body = retorno_medico_message(
                                medicamento.nome, data_retorno_str
                            )
                            await send_push(paciente.push_token, title, body)
                        continue

                    for vinculo in vinculos:
                        try:
                            resp_result = await db.execute(
                                select(Usuario).where(
                                    Usuario.id == vinculo.responsavel_id
                                )
                            )
                            responsavel = resp_result.scalar_one_or_none()
                            if responsavel is None:
                                continue

                            # Create NOTIFICACAO type=RETORNO_MEDICO
                            notificacao = Notificacao(
                                usuario_id=responsavel.id,
                                tipo=TipoNotificacao.RETORNO_MEDICO,
                                enviado_em=now,
                            )
                            db.add(notificacao)
                            await db.commit()

                            # Send push notification
                            if responsavel.push_token:
                                data_retorno_str = (
                                    medicamento.data_proximo_retorno.strftime(
                                        "%d/%m/%Y"
                                    )
                                )
                                title, body = retorno_medico_message(
                                    medicamento.nome,
                                    data_retorno_str,
                                )
                                await send_push(responsavel.push_token, title, body)

                            logger.info(
                                f"Sent RETORNO_MEDICO alert for medicamento "
                                f"{medicamento.id} to user {responsavel.id}"
                            )

                        except Exception as e:
                            logger.error(
                                f"Error notifying responsavel "
                                f"{vinculo.responsavel_id} about retorno: {e}"
                            )
                            await db.rollback()
                            continue

                except Exception as e:
                    logger.error(
                        f"Error processing medicamento {medicamento.id} "
                        f"for retorno alert: {e}"
                    )
                    await db.rollback()
                    continue

    except Exception as e:
        logger.error(f"Error in job_alertas_retorno_medico: {e}")


def _is_valid_day(agenda, today: date) -> bool:
    """Check if today is a valid day for the given agenda based on frequency."""
    from app.modules.agendas.models import FrequenciaTomada

    if agenda.frequencia == FrequenciaTomada.DIARIA:
        return True

    if agenda.frequencia in (FrequenciaTomada.SEMANAL, FrequenciaTomada.PERSONALIZADA):
        if not agenda.dias_semana:
            return True
        # dias_semana is stored as "1,3,5" where 0=Monday, 6=Sunday
        dias = [int(d.strip()) for d in agenda.dias_semana.split(",") if d.strip()]
        return today.weekday() in dias

    return True
