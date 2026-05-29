from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.timezone import LOCAL_TZ, now_local
from app.modules.agendas.models import Agenda
from app.modules.registros_tomada.models import RegistroTomada, StatusTomada


async def create(data: dict, db: AsyncSession) -> RegistroTomada:
    """Create a new registro de tomada."""
    registro = RegistroTomada(**data)
    db.add(registro)
    await db.commit()
    await db.refresh(registro)
    return registro


async def get_by_id(registro_id: int, db: AsyncSession) -> RegistroTomada | None:
    """Find a registro de tomada by ID."""
    result = await db.execute(
        select(RegistroTomada).where(RegistroTomada.id == registro_id)
    )
    return result.scalar_one_or_none()


async def list_by_paciente(
    paciente_id: int,
    db: AsyncSession,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    status_filter: str | None = None,
) -> list[RegistroTomada]:
    """List registros de tomada for a paciente with optional filters."""
    query = select(RegistroTomada).where(RegistroTomada.paciente_id == paciente_id)

    if data_inicio:
        query = query.where(
            RegistroTomada.data_hora_prevista >= datetime.combine(data_inicio, datetime.min.time(), tzinfo=LOCAL_TZ)
        )
    if data_fim:
        query = query.where(
            RegistroTomada.data_hora_prevista <= datetime.combine(data_fim, datetime.max.time(), tzinfo=LOCAL_TZ)
        )
    if status_filter:
        query = query.where(RegistroTomada.status == status_filter)

    query = query.order_by(RegistroTomada.data_hora_prevista.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_pending_in_window(
    start: datetime, end: datetime, db: AsyncSession
) -> list[tuple[Agenda, datetime]]:
    """
    Get active agendas that should generate registros in the given time window
    but don't have one yet.
    Returns list of tuples (agenda, data_hora_prevista).
    """
    # Get all active agendas
    agendas_result = await db.execute(
        select(Agenda).where(Agenda.ativo == True)
    )
    agendas = list(agendas_result.scalars().all())

    pending = []
    for agenda in agendas:
        # Calculate the data_hora_prevista for this agenda within the window
        current = start.replace(
            hour=agenda.horario.hour,
            minute=agenda.horario.minute,
            second=0,
            microsecond=0,
        )
        if current < start:
            current += timedelta(days=1)

        while current <= end:
            # Check if registro already exists for this agenda and time
            exists = await exists_for_agenda_time(agenda.id, current, db)
            if not exists:
                pending.append((agenda, current))
            current += timedelta(days=1)

    return pending


async def get_overdue(db: AsyncSession) -> list[RegistroTomada]:
    """
    Get registros with status PENDENTE where
    data_hora_prevista + tolerancia_minutos < now.
    """
    now = now_local()
    result = await db.execute(
        select(RegistroTomada)
        .join(Agenda, RegistroTomada.agenda_id == Agenda.id)
        .where(
            RegistroTomada.status == StatusTomada.PENDENTE,
            RegistroTomada.data_hora_prevista
            + timedelta(minutes=1) * Agenda.tolerancia_minutos
            < now,
        )
    )
    return list(result.scalars().all())


async def get_stale_atrasados(db: AsyncSession) -> list[RegistroTomada]:
    """
    Get registros with status ATRASADO where data_hora_prevista + 2h < now.
    """
    now = now_local()
    two_hours_ago = now - timedelta(hours=2)
    result = await db.execute(
        select(RegistroTomada).where(
            RegistroTomada.status == StatusTomada.ATRASADO,
            RegistroTomada.data_hora_prevista < two_hours_ago,
        )
    )
    return list(result.scalars().all())


async def confirm(
    registro: RegistroTomada, user_id: int, db: AsyncSession
) -> RegistroTomada:
    """Confirm a registro de tomada."""
    registro.status = StatusTomada.CONFIRMADO
    registro.data_hora_confirmacao = now_local()
    registro.usuario_confirmacao_id = user_id
    await db.commit()
    await db.refresh(registro)
    return registro


async def exists_for_agenda_time(
    agenda_id: int, data_hora_prevista: datetime, db: AsyncSession
) -> bool:
    """Check if a registro already exists for a given agenda on the same date."""
    from sqlalchemy import cast, Date as SADate

    # Compare by agenda_id and date only (ignores timezone differences)
    target_date = data_hora_prevista.date() if hasattr(data_hora_prevista, 'date') else data_hora_prevista
    result = await db.execute(
        select(RegistroTomada).where(
            RegistroTomada.agenda_id == agenda_id,
            cast(RegistroTomada.data_hora_prevista, SADate) == target_date,
        )
    )
    return result.scalar_one_or_none() is not None
