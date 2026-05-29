from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.admin import repository
from app.modules.admin.schemas import (
    CategoriaCreateRequest,
    CategoriaUpdateRequest,
    ForcarLogoutResponse,
    MetricasResponse,
    PaginatedUsuariosResponse,
    UsuarioAdminResponse,
    UsuarioDetalheAdminResponse,
)
from app.modules.medicamentos.models import Categoria
from app.modules.usuarios.models import TipoUsuario


# ─── Gerenciamento de Usuários (Task 5.1) ─────────────────────────────────────


async def listar_usuarios(
    db: AsyncSession,
    page: int,
    size: int,
    tipo_filtro: TipoUsuario | None = None,
    busca: str | None = None,
) -> PaginatedUsuariosResponse:
    """Lista paginada de usuários com filtros opcionais."""
    usuarios, total = await repository.listar_todos_usuarios(
        db, page=page, size=size, tipo=tipo_filtro, busca=busca
    )
    items = [UsuarioAdminResponse.model_validate(u) for u in usuarios]
    return PaginatedUsuariosResponse(
        items=items, total=total, page=page, size=size
    )


async def obter_usuario(
    db: AsyncSession, usuario_id: int
) -> UsuarioDetalheAdminResponse:
    """Obtém detalhes de um usuário pelo ID."""
    usuario = await repository.obter_usuario_por_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    return UsuarioDetalheAdminResponse.model_validate(usuario)


async def ativar_usuario(
    db: AsyncSession, usuario_id: int, admin_id: int
) -> UsuarioAdminResponse:
    """Ativa um usuário. Admin não pode ativar/desativar a si mesmo."""
    if usuario_id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin não pode desativar a própria conta",
        )
    usuario = await repository.obter_usuario_por_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    usuario = await repository.atualizar_status_usuario(db, usuario, True)
    return UsuarioAdminResponse.model_validate(usuario)


async def desativar_usuario(
    db: AsyncSession, usuario_id: int, admin_id: int
) -> UsuarioAdminResponse:
    """Desativa um usuário. Admin não pode desativar a si mesmo."""
    if usuario_id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin não pode desativar a própria conta",
        )
    usuario = await repository.obter_usuario_por_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    usuario = await repository.atualizar_status_usuario(db, usuario, False)
    return UsuarioAdminResponse.model_validate(usuario)


async def alterar_tipo_usuario(
    db: AsyncSession, usuario_id: int, novo_tipo: TipoUsuario, admin_id: int
) -> UsuarioAdminResponse:
    """Altera o tipo de um usuário. Admin não pode alterar o próprio tipo."""
    if usuario_id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin não pode alterar o próprio tipo",
        )
    usuario = await repository.obter_usuario_por_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    usuario = await repository.atualizar_tipo_usuario(db, usuario, novo_tipo)
    return UsuarioAdminResponse.model_validate(usuario)


# ─── Categorias (Task 5.2) ────────────────────────────────────────────────────


async def criar_categoria(
    db: AsyncSession, data: CategoriaCreateRequest
) -> Categoria:
    """Cria uma nova categoria. Rejeita se nome já existir."""
    if await repository.categoria_existe_por_nome(db, data.nome):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Categoria já existe",
        )
    return await repository.criar_categoria(db, nome=data.nome, descricao=data.descricao)


async def atualizar_categoria(
    db: AsyncSession, categoria_id: int, data: CategoriaUpdateRequest
) -> Categoria:
    """Atualiza uma categoria existente. Verifica duplicidade de nome."""
    categoria = await repository.obter_categoria_por_id(db, categoria_id)
    if categoria is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada",
        )
    if data.nome is not None and data.nome != categoria.nome:
        if await repository.categoria_existe_por_nome(db, data.nome):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Categoria já existe",
            )
    return await repository.atualizar_categoria(
        db, categoria, nome=data.nome, descricao=data.descricao
    )


async def excluir_categoria(db: AsyncSession, categoria_id: int) -> None:
    """Exclui uma categoria. Rejeita se possuir medicamentos associados."""
    categoria = await repository.obter_categoria_por_id(db, categoria_id)
    if categoria is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria não encontrada",
        )
    if await repository.categoria_possui_medicamentos(db, categoria_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Categoria possui medicamentos associados",
        )
    await repository.excluir_categoria(db, categoria)


# ─── Métricas (Task 5.3) ──────────────────────────────────────────────────────


async def obter_metricas(db: AsyncSession) -> MetricasResponse:
    """Agrega todas as métricas do sistema em tempo real."""
    usuarios_por_tipo = await repository.contar_usuarios_por_tipo(db)
    usuarios_ativos = await repository.contar_usuarios_ativos(db)
    vinculos_ativos = await repository.contar_vinculos_ativos(db)
    taxa_adesao = await repository.calcular_taxa_adesao(db, dias=30)
    registros_problematicos = await repository.contar_registros_problematicos(db, dias=30)

    return MetricasResponse(
        usuarios_por_tipo=usuarios_por_tipo,
        usuarios_ativos=usuarios_ativos,
        vinculos_ativos=vinculos_ativos,
        taxa_adesao_30d=taxa_adesao,
        registros_atrasados_30d=registros_problematicos.get("ATRASADO", 0),
        registros_ignorados_30d=registros_problematicos.get("IGNORADO", 0),
    )


# ─── Forçar Logout (Task 5.4) ─────────────────────────────────────────────────


async def forcar_logout(
    db: AsyncSession, usuario_id: int, admin_id: int
) -> ForcarLogoutResponse:
    """Revoga todos os refresh tokens de um usuário. Admin não pode revogar os próprios."""
    if usuario_id == admin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin não pode revogar os próprios tokens",
        )
    usuario = await repository.obter_usuario_por_id(db, usuario_id)
    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )
    count = await repository.revogar_tokens_usuario(db, usuario_id)
    return ForcarLogoutResponse(tokens_revogados=count)
