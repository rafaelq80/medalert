"""
Tests for user registration with conditional validations.
"""

import pytest
from httpx import AsyncClient

from app.modules.usuarios.models import Usuario
from tests.conftest import get_auth_headers


pytestmark = pytest.mark.asyncio


async def test_register_paciente_with_all_required_fields(client: AsyncClient):
    """Test PACIENTE registration with all required fields succeeds."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Novo Paciente",
            "email": "novo_paciente@test.com",
            "senha": "senha123",
            "tipo": "PACIENTE",
            "data_nascimento": "1985-03-20",
            "obs_medicas": "Diabetes tipo 2",
            "nivel_autonomia": "TOTAL",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["nome"] == "Novo Paciente"
    assert data["tipo"] == "PACIENTE"
    assert data["data_nascimento"] == "1985-03-20"
    assert data["obs_medicas"] == "Diabetes tipo 2"
    assert data["nivel_autonomia"] == "TOTAL"


async def test_register_paciente_missing_data_nascimento(client: AsyncClient):
    """Test PACIENTE registration without data_nascimento returns 422."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Paciente Incompleto",
            "email": "incompleto@test.com",
            "senha": "senha123",
            "tipo": "PACIENTE",
            "obs_medicas": "Nenhuma",
            "nivel_autonomia": "TOTAL",
        },
    )
    assert response.status_code == 422


async def test_register_paciente_missing_obs_medicas(client: AsyncClient):
    """Test PACIENTE registration without obs_medicas returns 422."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Paciente Incompleto",
            "email": "incompleto2@test.com",
            "senha": "senha123",
            "tipo": "PACIENTE",
            "data_nascimento": "1990-01-01",
            "nivel_autonomia": "TOTAL",
        },
    )
    assert response.status_code == 422


async def test_register_paciente_missing_nivel_autonomia(client: AsyncClient):
    """Test PACIENTE registration without nivel_autonomia returns 422."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Paciente Incompleto",
            "email": "incompleto3@test.com",
            "senha": "senha123",
            "tipo": "PACIENTE",
            "data_nascimento": "1990-01-01",
            "obs_medicas": "Nenhuma",
        },
    )
    assert response.status_code == 422


async def test_register_responsavel_with_all_required_fields(client: AsyncClient):
    """Test RESPONSAVEL registration with all required fields succeeds."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Novo Responsável",
            "email": "novo_responsavel@test.com",
            "senha": "senha123",
            "tipo": "RESPONSAVEL",
            "grau_parentesco": "Filho(a)",
            "recebe_notificacoes": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["tipo"] == "RESPONSAVEL"
    assert data["grau_parentesco"] == "Filho(a)"
    assert data["recebe_notificacoes"] is True


async def test_register_responsavel_missing_grau_parentesco(client: AsyncClient):
    """Test RESPONSAVEL registration without grau_parentesco returns 422."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Responsável Incompleto",
            "email": "resp_incompleto@test.com",
            "senha": "senha123",
            "tipo": "RESPONSAVEL",
            "recebe_notificacoes": True,
        },
    )
    assert response.status_code == 422


async def test_register_responsavel_missing_recebe_notificacoes(client: AsyncClient):
    """Test RESPONSAVEL registration without recebe_notificacoes returns 422."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Responsável Incompleto",
            "email": "resp_incompleto2@test.com",
            "senha": "senha123",
            "tipo": "RESPONSAVEL",
            "grau_parentesco": "Filho(a)",
        },
    )
    assert response.status_code == 422


async def test_register_duplicate_email(client: AsyncClient, paciente_user: Usuario):
    """Test registration with duplicate email returns 409."""
    response = await client.post(
        "/usuarios",
        json={
            "nome": "Duplicado",
            "email": "paciente@test.com",
            "senha": "senha123",
            "tipo": "PACIENTE",
            "data_nascimento": "1990-01-01",
            "obs_medicas": "Nenhuma",
            "nivel_autonomia": "TOTAL",
        },
    )
    assert response.status_code == 409
