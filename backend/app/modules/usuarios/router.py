from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.usuarios.models import Usuario
from app.modules.usuarios.schemas import (
    PushTokenUpdate,
    UsuarioBuscaResponse,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)
from app.modules.usuarios.service import (
    buscar_paciente_por_email,
    create_user,
    get_profile,
    update_profile,
    update_push_token,
)

router = APIRouter(
    tags=["Usuários"],
    responses={401: {"description": "Token inválido ou expirado"}},
)


@router.post("", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UsuarioCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user (no authentication required)."""
    user = await create_user(user_data, db)
    return UsuarioResponse.model_validate(user)


@router.get("/buscar", response_model=UsuarioBuscaResponse)
async def buscar_paciente(
    email: str = Query(..., description="E-mail do paciente a buscar"),
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search for a paciente by email. Only RESPONSAVEL/CUIDADOR can use this."""
    return await buscar_paciente_por_email(email, current_user, db)


@router.get("/me", response_model=UsuarioResponse)
async def get_me(current_user: Usuario = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    return await get_profile(current_user)


@router.put("/me", response_model=UsuarioResponse)
async def update_me(
    update_data: UsuarioUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's profile."""
    return await update_profile(current_user, update_data, db)


@router.put("/me/push-token", status_code=status.HTTP_204_NO_CONTENT)
async def update_my_push_token(
    push_token_data: PushTokenUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the authenticated user's push notification token."""
    await update_push_token(current_user, push_token_data, db)
