from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    medicamentos = relationship("Medicamento", back_populates="categoria", lazy="selectin")


class Medicamento(Base):
    __tablename__ = "medicamentos"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    paciente_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    categoria_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("categorias.id"), nullable=True
    )
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    dosagem: Mapped[str] = mapped_column(String(100), nullable=False)
    instrucoes: Mapped[str] = mapped_column(Text, nullable=False)
    uso_continuo: Mapped[bool] = mapped_column(Boolean, nullable=False)
    necessita_retorno: Mapped[bool] = mapped_column(Boolean, nullable=False)
    intervalo_retorno_dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    data_inicio_tratamento: Mapped[date] = mapped_column(Date, nullable=False)
    data_proximo_retorno: Mapped[date | None] = mapped_column(Date, nullable=True)
    retorno_realizado: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    data_retorno_realizado: Mapped[date | None] = mapped_column(Date, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    criado_por: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    atualizado_em: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    atualizado_por: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=True
    )

    # Relationships
    paciente = relationship("Usuario", foreign_keys=[paciente_id])
    categoria = relationship("Categoria", back_populates="medicamentos")
    criador = relationship("Usuario", foreign_keys=[criado_por])
    atualizador = relationship("Usuario", foreign_keys=[atualizado_por])
    agendas = relationship("Agenda", back_populates="medicamento", lazy="selectin")
