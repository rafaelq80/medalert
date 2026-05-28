"""
Tests for authentication flow: login, refresh, logout, expired token.
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from app.modules.usuarios.models import Usuario
from tests.conftest import get_auth_headers


pytestmark = pytest.mark.asyncio


async def test_login_valid_credentials(client: AsyncClient, paciente_user: Usuario):
    """Test successful login with valid credentials."""
    response = await client.post(
        "/auth/login",
        json={"email": "paciente@test.com", "senha": "senha123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


async def test_login_invalid_credentials(client: AsyncClient, paciente_user: Usuario):
    """Test login with wrong password returns 401."""
    response = await client.post(
        "/auth/login",
        json={"email": "paciente@test.com", "senha": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with non-existent email returns 401."""
    response = await client.post(
        "/auth/login",
        json={"email": "nobody@test.com", "senha": "senha123"},
    )
    assert response.status_code == 401


async def test_expired_token_returns_401(client: AsyncClient):
    """Test that an expired/invalid token returns 401."""
    response = await client.get(
        "/usuarios/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401


async def test_refresh_token_flow(client: AsyncClient, paciente_user: Usuario):
    """Test refresh token returns a new access token."""
    # First login to get tokens
    login_response = await client.post(
        "/auth/login",
        json={"email": "paciente@test.com", "senha": "senha123"},
    )
    tokens = login_response.json()

    # Use refresh token to get new access token
    refresh_response = await client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 200
    data = refresh_response.json()
    assert "access_token" in data


async def test_refresh_with_invalid_token(client: AsyncClient):
    """Test refresh with invalid token returns 401."""
    response = await client.post(
        "/auth/refresh",
        json={"refresh_token": "invalid.refresh.token"},
    )
    assert response.status_code == 401


async def test_logout_revokes_refresh_token(client: AsyncClient, paciente_user: Usuario):
    """Test logout revokes the refresh token."""
    # Login
    login_response = await client.post(
        "/auth/login",
        json={"email": "paciente@test.com", "senha": "senha123"},
    )
    tokens = login_response.json()

    # Logout
    logout_response = await client.post(
        "/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert logout_response.status_code == 204

    # Try to use the revoked refresh token
    refresh_response = await client.post(
        "/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert refresh_response.status_code == 401


async def test_access_protected_endpoint_with_valid_token(
    client: AsyncClient, paciente_user: Usuario
):
    """Test accessing a protected endpoint with a valid token."""
    headers = get_auth_headers(paciente_user)
    response = await client.get("/usuarios/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "paciente@test.com"
