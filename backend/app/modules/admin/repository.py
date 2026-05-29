from datetime import datetime, timedelta, timezone

from sqlalchemy import and_, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.timezone import LOCAL_TZ
from app.modules.auth.models import RefreshToken
from app.modules.medicamentos.models import Categoria, Medicamento
from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
from app.modules.usuarios.models import TipoUsuario, Usuario
from app.modules.vinculos.models import Vinculo


# ─── Queries de usuários (Task 4.2) ───────────────────────────────────────────


async def listar_todos_usuarios(
    db: AsyncSession,
    page: int,
    size: int,
    tipo: TipoUsuario | None = None,
    busca: str | None = None,
) -> tuple[list[Usuario], int]:
    """Lista paginada de usuários com filtros opcionais por tipo e busca."""
    query = select(Usuario)
    count_query = select(func.count(Usuario.id))

    if tipo is not None:
        query = query.where(Usuario.tipo == tipo)
        count_query = count_query.where(Usuario.tipo == tipo)

    if busca:
        search_filter = or_(
            Usuario.nome.ilike(f"%{busca}%"),
            Usuario.email.ilike(f"%{busca}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    # Total count
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Paginated results
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(Usuario.id)
    result = await db.execute(query)
    usuarios = list(result.scalars().all())

    return usuarios, total


async def obter_usuario_por_id(
    db: AsyncSession, usuario_id: int
) -> Usuario | None:
    """Busca um usuário pelo ID."""
    result = await db.execute(select(Usuario).where(Usuario.id == usuario_id))
    return result.scalar_one_or_none()


async def atualizar_status_usuario(
    db: AsyncSession, usuario: Usuario, ativo: bool
) -> Usuario:
    """Atualiza o campo ativo de um usuário."""
    usuario.ativo = ativo
    await db.commit()
    await db.refresh(usuario)
    return usuario


async def atualizar_tipo_usuario(
    db: AsyncSession, usuario: Usuario, novo_tipo: TipoUsuario
) -> Usuario:
    """Atualiza o tipo de um usuário."""
    usuario.tipo = novo_tipo
    await db.commit()
    await db.refresh(usuario)
    return usuario


# ─── Queries de categorias (Task 4.3) ─────────────────────────────────────────


async def criar_categoria(
    db: AsyncSession, nome: str, descricao: str | None
) -> Categoria:
    """Cria uma nova categoria."""
    categoria = Categoria(nome=nome, descricao=descricao)
    db.add(categoria)
    await db.commit()
    await db.refresh(categoria)
    return categoria


async def atualizar_categoria(
    db: AsyncSession,
    categoria: Categoria,
    nome: str | None,
    descricao: str | None,
) -> Categoria:
    """Atualiza os campos de uma categoria existente."""
    if nome is not None:
        categoria.nome = nome
    if descricao is not None:
        categoria.descricao = descricao
    await db.commit()
    await db.refresh(categoria)
    return categoria


async def excluir_categoria(db: AsyncSession, categoria: Categoria) -> None:
    """Exclui fisicamente uma categoria (hard delete)."""
    await db.delete(categoria)
    await db.commit()


async def categoria_possui_medicamentos(
    db: AsyncSession, categoria_id: int
) -> bool:
    """Verifica se uma categoria possui medicamentos associados."""
    result = await db.execute(
        select(func.count(Medicamento.id)).where(
            Medicamento.categoria_id == categoria_id
        )
    )
    count = result.scalar_one()
    return count > 0


async def categoria_existe_por_nome(db: AsyncSession, nome: str) -> bool:
    """Verifica se já existe uma categoria com o nome informado."""
    result = await db.execute(
        select(func.count(Categoria.id)).where(Categoria.nome == nome)
    )
    count = result.scalar_one()
    return count > 0


async def obter_categoria_por_id(
    db: AsyncSession, categoria_id: int
) -> Categoria | None:
    """Busca uma categoria pelo ID."""
    result = await db.execute(
        select(Categoria).where(Categoria.id == categoria_id)
    )
    return result.scalar_one_or_none()


# ─── Queries de métricas (Task 4.4) ───────────────────────────────────────────


async def contar_usuarios_por_tipo(db: AsyncSession) -> dict[str, int]:
    """Conta usuários agrupados por tipo."""
    result = await db.execute(
        select(Usuario.tipo, func.count(Usuario.id)).group_by(Usuario.tipo)
    )
    return {row[0].value: row[1] for row in result.all()}


async def contar_usuarios_ativos(db: AsyncSession) -> int:
    """Conta o total de usuários ativos."""
    result = await db.execute(
        select(func.count(Usuario.id)).where(Usuario.ativo == True)
    )
    return result.scalar_one()


async def contar_vinculos_ativos(db: AsyncSession) -> int:
    """Conta o total de vínculos ativos."""
    result = await db.execute(
        select(func.count(Vinculo.id)).where(Vinculo.ativo == True)
    )
    return result.scalar_one()


async def calcular_taxa_adesao(db: AsyncSession, dias: int = 30) -> float:
    """
    Calcula a taxa de adesão (percentual de registros CONFIRMADO
    sobre o total de registros) nos últimos N dias.
    Retorna 0.0 se não houver registros no período.
    """
    data_limite = datetime.now(LOCAL_TZ) - timedelta(days=dias)

    total_result = await db.execute(
        select(func.count(RegistroTomada.id)).where(
            RegistroTomada.data_hora_prevista >= data_limite
        )
    )
    total = total_result.scalar_one()

    if total == 0:
        return 0.0

    confirmados_result = await db.execute(
        select(func.count(RegistroTomada.id)).where(
            and_(
                RegistroTomada.data_hora_prevista >= data_limite,
                RegistroTomada.status == StatusTomada.CONFIRMADO,
            )
        )
    )
    confirmados = confirmados_result.scalar_one()

    return (confirmados / total) * 100


async def contar_registros_problematicos(
    db: AsyncSession, dias: int = 30
) -> dict[str, int]:
    """
    Conta registros ATRASADO e IGNORADO nos últimos N dias.
    Retorna dict com chaves 'ATRASADO' e 'IGNORADO'.
    """
    data_limite = datetime.now(LOCAL_TZ) - timedelta(days=dias)

    result = await db.execute(
        select(RegistroTomada.status, func.count(RegistroTomada.id))
        .where(
            and_(
                RegistroTomada.data_hora_prevista >= data_limite,
                RegistroTomada.status.in_([
                    StatusTomada.ATRASADO,
                    StatusTomada.IGNORADO,
                ]),
            )
        )
        .group_by(RegistroTomada.status)
    )

    counts = {StatusTomada.ATRASADO.value: 0, StatusTomada.IGNORADO.value: 0}
    for row in result.all():
        counts[row[0].value] = row[1]

    return counts


# ─── Queries de tokens (Task 4.5) ─────────────────────────────────────────────


async def revogar_tokens_usuario(db: AsyncSession, usuario_id: int) -> int:
    """
    Revoga todos os refresh tokens ativos (não revogados) de um usuário.
    Retorna a quantidade de tokens revogados.
    """
    result = await db.execute(
        update(RefreshToken)
        .where(
            and_(
                RefreshToken.user_id == usuario_id,
                RefreshToken.revogado == False,
            )
        )
        .values(revogado=True)
    )
    await db.commit()
    return result.rowcount
