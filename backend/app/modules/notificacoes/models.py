import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoNotificacao(str, enum.Enum):
    LEMBRETE = "LEMBRETE"
    FALHA_TOMADA = "FALHA_TOMADA"
    RETORNO_MEDICO = "RETORNO_MEDICO"


class Notificacao(Base):
    __tablename__ = "notificacoes"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    usuario_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    registro_tomada_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("registros_tomada.id"), nullable=True
    )
    tipo: Mapped[TipoNotificacao] = mapped_column(Enum(TipoNotificacao), nullable=False)
    enviado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    lido_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    registro_tomada = relationship("RegistroTomada", foreign_keys=[registro_tomada_id])
