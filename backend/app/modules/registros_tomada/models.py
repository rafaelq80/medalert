import enum
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StatusTomada(str, enum.Enum):
    PENDENTE = "PENDENTE"
    CONFIRMADO = "CONFIRMADO"
    ATRASADO = "ATRASADO"
    IGNORADO = "IGNORADO"


class RegistroTomada(Base):
    __tablename__ = "registros_tomada"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    agenda_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("agendas.id"), nullable=False
    )
    paciente_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    data_hora_prevista: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    data_hora_confirmacao: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[StatusTomada] = mapped_column(
        Enum(StatusTomada), nullable=False, default=StatusTomada.PENDENTE
    )
    usuario_confirmacao_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=True
    )

    # Relationships
    agenda = relationship("Agenda", back_populates="registros_tomada")
    paciente = relationship("Usuario", foreign_keys=[paciente_id])
    usuario_confirmacao = relationship("Usuario", foreign_keys=[usuario_confirmacao_id])

    __table_args__ = (
        UniqueConstraint("agenda_id", "data_hora_prevista", name="uq_agenda_data_hora_prevista"),
    )
