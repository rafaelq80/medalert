"""
Tests for confirmation flow: PENDENTE → CONFIRMADO within and outside tolerance.
"""

import pytest
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.agendas.models import Agenda
from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
from app.modules.usuarios.models import Usuario
from app.modules.vinculos.models import Vinculo
from tests.conftest import get_auth_headers


pytestmark = pytest.mark.asyncio


@pytest_asyncio.fixture
async def registro_pendente(
    db_session: AsyncSession, agenda: Agenda, paciente_user: Usuario
) -> RegistroTomada:
    """Create a PENDENTE registro de tomada within tolerance window."""
    now = datetime.now(timezone.utc)
    registro = RegistroTomada(
        agenda_id=agenda.id,
        paciente_id=paciente_user.id,
        data_hora_prevista=now - timedelta(minutes=10),  # 10 min ago, within 30min tolerance
        status=StatusTomada.PENDENTE,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)
    return registro


@pytest_asyncio.fixture
async def registro_pendente_outside_tolerance(
    db_session: AsyncSession, agenda: Agenda, paciente_user: Usuario
) -> RegistroTomada:
    """Create a PENDENTE registro de tomada outside tolerance window."""
    now = datetime.now(timezone.utc)
    registro = RegistroTomada(
        agenda_id=agenda.id,
        paciente_id=paciente_user.id,
        data_hora_prevista=now - timedelta(minutes=60),  # 60 min ago, outside 30min tolerance
        status=StatusTomada.PENDENTE,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)
    return registro


async def test_confirm_registro_within_tolerance(
    client: AsyncClient,
    paciente_user: Usuario,
    registro_pendente: RegistroTomada,
    active_vinculo: Vinculo,
):
    """Test confirming a registro within tolerance window succeeds."""
    headers = get_auth_headers(paciente_user)
    response = await client.put(
        f"/registros-tomada/{registro_pendente.id}/confirmar",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CONFIRMADO"
    assert data["data_hora_confirmacao"] is not None
    assert data["usuario_confirmacao_id"] == paciente_user.id


async def test_confirm_registro_outside_tolerance(
    client: AsyncClient,
    paciente_user: Usuario,
    registro_pendente_outside_tolerance: RegistroTomada,
    active_vinculo: Vinculo,
):
    """Test confirming a registro outside tolerance window still succeeds (user can confirm late)."""
    headers = get_auth_headers(paciente_user)
    response = await client.put(
        f"/registros-tomada/{registro_pendente_outside_tolerance.id}/confirmar",
        headers=headers,
    )
    # The service allows confirmation regardless of tolerance (tolerance is for scheduler)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CONFIRMADO"


async def test_cannot_confirm_already_confirmed(
    client: AsyncClient,
    paciente_user: Usuario,
    db_session: AsyncSession,
    agenda: Agenda,
    active_vinculo: Vinculo,
):
    """Test that confirming an already CONFIRMADO registro returns 400."""
    now = datetime.now(timezone.utc)
    registro = RegistroTomada(
        agenda_id=agenda.id,
        paciente_id=paciente_user.id,
        data_hora_prevista=now - timedelta(minutes=5),
        status=StatusTomada.CONFIRMADO,
        data_hora_confirmacao=now,
        usuario_confirmacao_id=paciente_user.id,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    headers = get_auth_headers(paciente_user)
    response = await client.put(
        f"/registros-tomada/{registro.id}/confirmar",
        headers=headers,
    )
    assert response.status_code == 400


async def test_cannot_confirm_ignorado(
    client: AsyncClient,
    paciente_user: Usuario,
    db_session: AsyncSession,
    agenda: Agenda,
    active_vinculo: Vinculo,
):
    """Test that confirming an IGNORADO registro returns 400."""
    now = datetime.now(timezone.utc)
    registro = RegistroTomada(
        agenda_id=agenda.id,
        paciente_id=paciente_user.id,
        data_hora_prevista=now - timedelta(hours=3),
        status=StatusTomada.IGNORADO,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    headers = get_auth_headers(paciente_user)
    response = await client.put(
        f"/registros-tomada/{registro.id}/confirmar",
        headers=headers,
    )
    assert response.status_code == 400


async def test_confirm_atrasado_registro_succeeds(
    client: AsyncClient,
    paciente_user: Usuario,
    db_session: AsyncSession,
    agenda: Agenda,
    active_vinculo: Vinculo,
):
    """Test that confirming an ATRASADO registro succeeds (late confirmation)."""
    now = datetime.now(timezone.utc)
    registro = RegistroTomada(
        agenda_id=agenda.id,
        paciente_id=paciente_user.id,
        data_hora_prevista=now - timedelta(minutes=45),
        status=StatusTomada.ATRASADO,
    )
    db_session.add(registro)
    await db_session.commit()
    await db_session.refresh(registro)

    headers = get_auth_headers(paciente_user)
    response = await client.put(
        f"/registros-tomada/{registro.id}/confirmar",
        headers=headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "CONFIRMADO"
