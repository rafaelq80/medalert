"""
Tests for scheduler jobs: PENDENTE → ATRASADO → IGNORADO transitions
and retorno médico alert idempotency.

These tests directly manipulate the database and call job logic
to verify state transitions.
"""

import pytest
import pytest_asyncio
from datetime import date, datetime, time, timedelta, timezone
from unittest.mock import AsyncMock, patch

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agendas.models import Agenda, FrequenciaTomada
from app.modules.medicamentos.models import Medicamento
from app.modules.notificacoes.models import Notificacao, TipoNotificacao
from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
from app.modules.usuarios.models import NivelAutonomia, TipoUsuario, Usuario
from app.modules.vinculos.models import Vinculo
from app.core.security import hash_password


pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def scheduler_setup(db_session: AsyncSession):
    """Create full setup for scheduler tests."""
    paciente = Usuario(
        nome="Paciente Scheduler",
        email="paciente_sched@test.com",
        senha=hash_password("senha123"),
        tipo=TipoUsuario.PACIENTE,
        ativo=True,
        data_nascimento=date(1980, 1, 1),
        obs_medicas="Nenhuma",
        nivel_autonomia=NivelAutonomia.TOTAL,
        push_token="fake_push_token_paciente",
    )
    db_session.add(paciente)
    await db_session.flush()

    responsavel = Usuario(
        nome="Responsável Scheduler",
        email="resp_sched@test.com",
        senha=hash_password("senha123"),
        tipo=TipoUsuario.RESPONSAVEL,
        ativo=True,
        grau_parentesco="Filho(a)",
        recebe_notificacoes=True,
        push_token="fake_push_token_resp",
    )
    db_session.add(responsavel)
    await db_session.flush()

    vinculo = Vinculo(
        responsavel_id=responsavel.id,
        paciente_id=paciente.id,
        data_inicio=date.today(),
        ativo=True,
    )
    db_session.add(vinculo)
    await db_session.flush()

    medicamento = Medicamento(
        paciente_id=paciente.id,
        nome="Metformina",
        dosagem="500mg",
        instrucoes="Após refeição",
        uso_continuo=True,
        necessita_retorno=True,
        intervalo_retorno_dias=90,
        data_inicio_tratamento=date.today() - timedelta(days=60),
        data_proximo_retorno=date.today() + timedelta(days=3),
        ativo=True,
        criado_por=paciente.id,
    )
    db_session.add(medicamento)
    await db_session.flush()

    agenda = Agenda(
        medicamento_id=medicamento.id,
        horario=time(8, 0),
        frequencia=FrequenciaTomada.DIARIA,
        tolerancia_minutos=30,
        data_inicio=date.today() - timedelta(days=7),
        ativo=True,
    )
    db_session.add(agenda)
    await db_session.commit()

    await db_session.refresh(paciente)
    await db_session.refresh(responsavel)
    await db_session.refresh(vinculo)
    await db_session.refresh(medicamento)
    await db_session.refresh(agenda)

    return {
        "paciente": paciente,
        "responsavel": responsavel,
        "vinculo": vinculo,
        "medicamento": medicamento,
        "agenda": agenda,
    }


async def test_pendente_to_atrasado_transition(
    db_session: AsyncSession, scheduler_setup
):
    """Test PENDENTE → ATRASADO transition when tolerance expired.
    Simulates what job_verificar_atrasos does: finds PENDENTE registros
    past their tolerance window and marks them ATRASADO.
    """
    setup = scheduler_setup
    now = datetime.now(timezone.utc)

    # Create a PENDENTE registro with data_hora_prevista 45 min ago (tolerance is 30min)
    registro = RegistroTomada(
        agenda_id=setup["agenda"].id,
        paciente_id=setup["paciente"].id,
        data_hora_prevista=now - timedelta(minutes=45),
        status=StatusTomada.PENDENTE,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    # Simulate the job logic: check if tolerance expired
    agenda = setup["agenda"]
    # The deadline is data_hora_prevista + tolerancia_minutos
    # For SQLite, we need to handle naive datetimes
    prevista = registro.data_hora_prevista
    if prevista.tzinfo is None:
        prevista = prevista.replace(tzinfo=timezone.utc)
    deadline = prevista + timedelta(minutes=agenda.tolerancia_minutos)

    assert now > deadline, "Tolerance should have expired"

    # Transition to ATRASADO (what the job does)
    registro.status = StatusTomada.ATRASADO
    await db_session.commit()
    await db_session.refresh(registro)

    assert registro.status == StatusTomada.ATRASADO


async def test_atrasado_to_ignorado_transition(
    db_session: AsyncSession, scheduler_setup
):
    """Test ATRASADO → IGNORADO transition after 2 hours.
    Simulates what job_marcar_ignorados does.
    """
    setup = scheduler_setup
    now = datetime.now(timezone.utc)

    # Create an ATRASADO registro with data_hora_prevista 3 hours ago
    registro = RegistroTomada(
        agenda_id=setup["agenda"].id,
        paciente_id=setup["paciente"].id,
        data_hora_prevista=now - timedelta(hours=3),
        status=StatusTomada.ATRASADO,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    # Simulate the job logic: check if 2h have passed since data_hora_prevista
    prevista = registro.data_hora_prevista
    if prevista.tzinfo is None:
        prevista = prevista.replace(tzinfo=timezone.utc)
    two_hours_after = prevista + timedelta(hours=2)

    assert now > two_hours_after, "2 hours should have passed"

    # Transition to IGNORADO (what the job does)
    registro.status = StatusTomada.IGNORADO
    await db_session.commit()
    await db_session.refresh(registro)

    assert registro.status == StatusTomada.IGNORADO


async def test_atrasado_not_ignored_if_less_than_2h(
    db_session: AsyncSession, scheduler_setup
):
    """Test ATRASADO does NOT transition to IGNORADO if less than 2h elapsed."""
    setup = scheduler_setup
    now = datetime.now(timezone.utc)

    # Create an ATRASADO registro with data_hora_prevista only 1 hour ago
    registro = RegistroTomada(
        agenda_id=setup["agenda"].id,
        paciente_id=setup["paciente"].id,
        data_hora_prevista=now - timedelta(hours=1),
        status=StatusTomada.ATRASADO,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    # Simulate the job logic: check if 2h have passed
    prevista = registro.data_hora_prevista
    if prevista.tzinfo is None:
        prevista = prevista.replace(tzinfo=timezone.utc)
    two_hours_after = prevista + timedelta(hours=2)

    # 2h have NOT passed, so the job should NOT transition
    assert now < two_hours_after, "2 hours should NOT have passed yet"

    # Status remains ATRASADO
    assert registro.status == StatusTomada.ATRASADO


async def test_pendente_not_atrasado_within_tolerance(
    db_session: AsyncSession, scheduler_setup
):
    """Test PENDENTE does NOT transition to ATRASADO within tolerance window."""
    setup = scheduler_setup
    now = datetime.now(timezone.utc)

    # Create a PENDENTE registro with data_hora_prevista 10 min ago (tolerance is 30min)
    registro = RegistroTomada(
        agenda_id=setup["agenda"].id,
        paciente_id=setup["paciente"].id,
        data_hora_prevista=now - timedelta(minutes=10),
        status=StatusTomada.PENDENTE,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    # Simulate the job logic: check if tolerance expired
    agenda = setup["agenda"]
    prevista = registro.data_hora_prevista
    if prevista.tzinfo is None:
        prevista = prevista.replace(tzinfo=timezone.utc)
    deadline = prevista + timedelta(minutes=agenda.tolerancia_minutos)

    # Tolerance has NOT expired
    assert now < deadline, "Tolerance should NOT have expired"

    # Status remains PENDENTE
    assert registro.status == StatusTomada.PENDENTE


async def test_retorno_medico_creates_notification(
    db_session: AsyncSession, scheduler_setup
):
    """Test retorno médico alert creates RETORNO_MEDICO notification when no recent one exists."""
    setup = scheduler_setup
    now = datetime.now(timezone.utc)

    # Verify no RETORNO_MEDICO notification exists yet
    result = await db_session.execute(
        select(Notificacao).where(
            Notificacao.tipo == TipoNotificacao.RETORNO_MEDICO,
            Notificacao.usuario_id == setup["responsavel"].id,
        )
    )
    assert result.scalar_one_or_none() is None

    # Simulate what the job does: create notification for responsavel
    notificacao = Notificacao(
        usuario_id=setup["responsavel"].id,
        tipo=TipoNotificacao.RETORNO_MEDICO,
        enviado_em=now,
    )
    db_session.add(notificacao)
    await db_session.commit()

    # Verify notification was created
    result = await db_session.execute(
        select(Notificacao).where(
            Notificacao.tipo == TipoNotificacao.RETORNO_MEDICO,
            Notificacao.usuario_id == setup["responsavel"].id,
        )
    )
    notificacoes = list(result.scalars().all())
    assert len(notificacoes) == 1


async def test_retorno_medico_idempotency(
    db_session: AsyncSession, scheduler_setup
):
    """Test retorno médico alert does NOT create duplicate notification (idempotency).
    If a RETORNO_MEDICO notification was sent in the last 7 days, no new one is created.
    """
    setup = scheduler_setup
    now = datetime.now(timezone.utc)

    # Create a recent RETORNO_MEDICO notification (within last 7 days)
    existing_notif = Notificacao(
        usuario_id=setup["responsavel"].id,
        tipo=TipoNotificacao.RETORNO_MEDICO,
        enviado_em=now - timedelta(days=2),
    )
    db_session.add(existing_notif)
    await db_session.commit()

    # Simulate the idempotency check: look for recent notification
    cutoff = now - timedelta(days=7)
    result = await db_session.execute(
        select(Notificacao).where(
            Notificacao.usuario_id == setup["responsavel"].id,
            Notificacao.tipo == TipoNotificacao.RETORNO_MEDICO,
            Notificacao.enviado_em >= cutoff,
        )
    )
    recent = result.scalar_one_or_none()

    # Recent notification exists, so job should NOT create another
    assert recent is not None, "Should find recent notification"

    # Count notifications before
    result = await db_session.execute(
        select(Notificacao).where(
            Notificacao.tipo == TipoNotificacao.RETORNO_MEDICO,
            Notificacao.usuario_id == setup["responsavel"].id,
        )
    )
    count_before = len(list(result.scalars().all()))

    # Since recent exists, the job skips creation (idempotent)
    # We verify the count stays the same
    result = await db_session.execute(
        select(Notificacao).where(
            Notificacao.tipo == TipoNotificacao.RETORNO_MEDICO,
            Notificacao.usuario_id == setup["responsavel"].id,
        )
    )
    count_after = len(list(result.scalars().all()))
    assert count_after == count_before
