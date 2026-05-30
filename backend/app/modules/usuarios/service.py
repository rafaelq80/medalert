from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.usuarios.repository import create, get_by_email, update
from app.modules.usuarios.schemas import (
    PushTokenUpdate,
    SenhaUpdate,
    UsuarioBuscaResponse,
    UsuarioCreate,
    UsuarioResponse,
    UsuarioUpdate,
)


async def create_user(user_data: UsuarioCreate, db: AsyncSession) -> Usuario:
    """Create a new user after validating email uniqueness."""
    # Block ADMIN creation via API
    if user_data.tipo == TipoUsuario.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é permitido criar usuários ADMIN via API",
        )

    existing = await get_by_email(user_data.email, db)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado",
        )

    # Hash password before persisting
    data = user_data.model_dump()
    data["senha"] = hash_password(data["senha"])

    return await create(data, db)


async def get_profile(user: Usuario) -> UsuarioResponse:
    """Return the user profile as a response schema."""
    return UsuarioResponse.model_validate(user)


async def update_profile(
    user: Usuario, update_data: UsuarioUpdate, db: AsyncSession
) -> UsuarioResponse:
    """Update user profile fields."""
    data = update_data.model_dump(exclude_unset=True)
    updated_user = await update(user, data, db)
    return UsuarioResponse.model_validate(updated_user)


async def update_push_token(
    user: Usuario, push_token_data: PushTokenUpdate, db: AsyncSession
) -> None:
    """Update the user's push notification token."""
    user.push_token = push_token_data.push_token
    await db.commit()


async def buscar_paciente_por_email(
    email: str, current_user: Usuario, db: AsyncSession
) -> UsuarioBuscaResponse:
    """Search for a paciente by email. Only RESPONSAVEL/CUIDADOR can search."""
    if current_user.tipo not in (TipoUsuario.RESPONSAVEL, TipoUsuario.CUIDADOR, TipoUsuario.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas responsáveis ou cuidadores podem buscar pacientes",
        )

    paciente = await get_by_email(email.strip().lower(), db)

    if paciente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum paciente encontrado com este e-mail",
        )

    if paciente.tipo != TipoUsuario.PACIENTE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O usuário encontrado não é um paciente",
        )

    if not paciente.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum paciente encontrado com este e-mail",
        )

    return UsuarioBuscaResponse.model_validate(paciente)


async def change_password(
    user: Usuario, senha_data: SenhaUpdate, db: AsyncSession
) -> None:
    """Change user password after verifying current password."""
    if not verify_password(senha_data.senha_atual, user.senha):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta",
        )

    if len(senha_data.nova_senha) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="A nova senha deve ter pelo menos 6 caracteres",
        )

    user.senha = hash_password(senha_data.nova_senha)
    await db.commit()
