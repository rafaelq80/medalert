from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_admin, get_db
from app.modules.admin import service
from app.modules.admin.schemas import (
    AlterarTipoRequest,
    CategoriaCreateRequest,
    CategoriaUpdateRequest,
    ForcarLogoutResponse,
    MetricasResponse,
    PaginatedUsuariosResponse,
    UsuarioAdminResponse,
    UsuarioDetalheAdminResponse,
)
from app.modules.usuarios.models import TipoUsuario, Usuario

router = APIRouter(tags=["Admin"])


# ─── Gerenciamento de Usuários ─────────────────────────────────────────────────


@router.get("/usuarios", response_model=PaginatedUsuariosResponse)
async def listar_usuarios(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    tipo: TipoUsuario | None = None,
    busca: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Lista paginada de usuários com filtros opcionais."""
    return await service.listar_usuarios(
        db, page=page, size=size, tipo_filtro=tipo, busca=busca
    )


@router.get("/usuarios/{usuario_id}", response_model=UsuarioDetalheAdminResponse)
async def obter_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Obtém detalhes de um usuário pelo ID."""
    return await service.obter_usuario(db, usuario_id)


@router.patch("/usuarios/{usuario_id}/ativar", response_model=UsuarioAdminResponse)
async def ativar_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Ativa um usuário."""
    return await service.ativar_usuario(db, usuario_id, current_user.id)


@router.patch("/usuarios/{usuario_id}/desativar", response_model=UsuarioAdminResponse)
async def desativar_usuario(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Desativa um usuário."""
    return await service.desativar_usuario(db, usuario_id, current_user.id)


@router.patch("/usuarios/{usuario_id}/tipo", response_model=UsuarioAdminResponse)
async def alterar_tipo_usuario(
    usuario_id: int,
    data: AlterarTipoRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Altera o tipo de um usuário."""
    return await service.alterar_tipo_usuario(
        db, usuario_id, data.novo_tipo, current_user.id
    )


@router.post("/usuarios/{usuario_id}/forcar-logout", response_model=ForcarLogoutResponse)
async def forcar_logout(
    usuario_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Revoga todos os refresh tokens de um usuário."""
    return await service.forcar_logout(db, usuario_id, current_user.id)


# ─── Métricas ──────────────────────────────────────────────────────────────────


@router.get("/metricas", response_model=MetricasResponse)
async def obter_metricas(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Retorna métricas agregadas do sistema."""
    return await service.obter_metricas(db)


# ─── Scheduler ─────────────────────────────────────────────────────────────────


@router.post("/scheduler/gerar-registros", status_code=status.HTTP_200_OK)
async def disparar_geracao_registros(
    current_user: Usuario = Depends(get_current_admin),
):
    """Dispara manualmente a geração de registros de tomada do dia."""
    from app.scheduler.jobs import job_gerar_registros_tomada

    await job_gerar_registros_tomada()
    return {"detail": "Job executado com sucesso. Registros do dia gerados."}


@router.post("/categorias", status_code=status.HTTP_201_CREATED)
async def criar_categoria(
    data: CategoriaCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Cria uma nova categoria de medicamentos."""
    return await service.criar_categoria(db, data)


@router.put("/categorias/{categoria_id}")
async def atualizar_categoria(
    categoria_id: int,
    data: CategoriaUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Atualiza uma categoria existente."""
    return await service.atualizar_categoria(db, categoria_id, data)


@router.delete("/categorias/{categoria_id}", status_code=status.HTTP_204_NO_CONTENT)
async def excluir_categoria(
    categoria_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_current_admin),
):
    """Exclui uma categoria de medicamentos."""
    await service.excluir_categoria(db, categoria_id)
