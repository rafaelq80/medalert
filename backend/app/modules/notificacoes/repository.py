from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notificacoes.models import Notificacao, TipoNotificacao


async def create(data: dict, db: AsyncSession) -> Notificacao:
    """Create a new notificacao."""
    notificacao = Notificacao(**data)
    db.add(notificacao)
    await db.commit()
    await db.refresh(notificacao)
    return notificacao


async def list_by_usuario(usuario_id: int, db: AsyncSession) -> list[Notificacao]:
    """List all notificacoes for a given usuario, ordered by most recent."""
    result = await db.execute(
        select(Notificacao)
        .where(Notificacao.usuario_id == usuario_id)
        .order_by(Notificacao.enviado_em.desc())
    )
    return list(result.scalars().all())


async def get_by_id(notificacao_id: int, db: AsyncSession) -> Notificacao | None:
    """Find a notificacao by ID."""
    result = await db.execute(
        select(Notificacao).where(Notificacao.id == notificacao_id)
    )
    return result.scalar_one_or_none()


async def mark_as_read(notificacao: Notificacao, db: AsyncSession) -> Notificacao:
    """Mark a notificacao as read by setting lido_em to now (UTC)."""
    notificacao.lido_em = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(notificacao)
    return notificacao


async def get_recent_retorno_medico(
    medicamento_id: int, days: int, db: AsyncSession
) -> Notificacao | None:
    """
    Find a RETORNO_MEDICO notification for the medicamento's paciente
    in the last N days.
    """
    from app.modules.medicamentos.models import Medicamento
    from app.modules.vinculos.models import Vinculo

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    # Get the paciente_id for this medicamento
    med_result = await db.execute(
        select(Medicamento.paciente_id).where(Medicamento.id == medicamento_id)
    )
    paciente_id = med_result.scalar_one_or_none()
    if paciente_id is None:
        return None

    # Get responsaveis linked to this paciente
    vinculo_result = await db.execute(
        select(Vinculo.responsavel_id).where(
            Vinculo.paciente_id == paciente_id,
            Vinculo.ativo == True,
        )
    )
    responsavel_ids = list(vinculo_result.scalars().all())

    if not responsavel_ids:
        return None

    # Check if there's a recent RETORNO_MEDICO notification for any linked responsavel
    result = await db.execute(
        select(Notificacao).where(
            Notificacao.usuario_id.in_(responsavel_ids),
            Notificacao.tipo == TipoNotificacao.RETORNO_MEDICO,
            Notificacao.enviado_em >= cutoff,
        )
    )
    return result.scalar_one_or_none()
