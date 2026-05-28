"""
Tests for medicamentos access control.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.models import Vinculo
from app.modules.medicamentos.models import Medicamento
from tests.conftest import get_auth_headers


pytestmark = pytest.mark.asyncio


async def test_responsavel_without_vinculo_cannot_access_patient_data(
    client: AsyncClient,
    paciente_user: Usuario,
    db_session: AsyncSession,
):
    """Test that a responsavel without vinculo cannot access patient medicamentos (403)."""
    # Create a responsavel user without any vinculo to the paciente
    other_responsavel = Usuario(
        nome="Outro Responsável",
        email="outro_resp@test.com",
        senha=hash_password("senha123"),
        tipo=TipoUsuario.RESPONSAVEL,
        ativo=True,
        grau_parentesco="Vizinho",
        recebe_notificacoes=True,
    )
    db_session.add(other_responsavel)
    await db_session.commit()
    await db_session.refresh(other_responsavel)

    headers = get_auth_headers(other_responsavel)
    response = await client.get(
        f"/pacientes/{paciente_user.id}/registros-tomada",
        headers=headers,
    )
    assert response.status_code == 403


async def test_responsavel_with_vinculo_can_access_patient_data(
    client: AsyncClient,
    paciente_user: Usuario,
    responsavel_user: Usuario,
    active_vinculo: Vinculo,
):
    """Test that a responsavel with active vinculo can access patient data."""
    headers = get_auth_headers(responsavel_user)
    response = await client.get(
        f"/pacientes/{paciente_user.id}/registros-tomada",
        headers=headers,
    )
    assert response.status_code == 200


async def test_paciente_can_access_own_data(
    client: AsyncClient,
    paciente_user: Usuario,
):
    """Test that a paciente can access their own data."""
    headers = get_auth_headers(paciente_user)
    response = await client.get(
        f"/pacientes/{paciente_user.id}/registros-tomada",
        headers=headers,
    )
    assert response.status_code == 200
