"""
Tests for vinculo creation and duplicate detection.
"""

import pytest
from httpx import AsyncClient

from app.modules.usuarios.models import Usuario
from app.modules.vinculos.models import Vinculo
from tests.conftest import get_auth_headers


pytestmark = pytest.mark.asyncio


async def test_create_vinculo_success(
    client: AsyncClient, paciente_user: Usuario, responsavel_user: Usuario
):
    """Test creating a vinculo between responsavel and paciente."""
    headers = get_auth_headers(responsavel_user)
    response = await client.post(
        "/vinculos",
        json={"paciente_id": paciente_user.id},
        headers=headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["responsavel_id"] == responsavel_user.id
    assert data["paciente_id"] == paciente_user.id
    assert data["ativo"] is True


async def test_create_duplicate_vinculo_returns_409(
    client: AsyncClient,
    paciente_user: Usuario,
    responsavel_user: Usuario,
    active_vinculo: Vinculo,
):
    """Test creating a duplicate active vinculo returns HTTP 409."""
    headers = get_auth_headers(responsavel_user)
    response = await client.post(
        "/vinculos",
        json={"paciente_id": paciente_user.id},
        headers=headers,
    )
    assert response.status_code == 409
    assert "já existe" in response.json()["detail"]


async def test_paciente_cannot_create_vinculo(
    client: AsyncClient, paciente_user: Usuario, responsavel_user: Usuario
):
    """Test that a PACIENTE user cannot create vinculos (403)."""
    headers = get_auth_headers(paciente_user)
    response = await client.post(
        "/vinculos",
        json={"paciente_id": responsavel_user.id},
        headers=headers,
    )
    assert response.status_code == 403


async def test_list_vinculos(
    client: AsyncClient,
    responsavel_user: Usuario,
    active_vinculo: Vinculo,
):
    """Test listing vinculos for the current user."""
    headers = get_auth_headers(responsavel_user)
    response = await client.get("/vinculos", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["ativo"] is True
