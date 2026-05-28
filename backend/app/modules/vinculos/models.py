from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, Boolean, Date, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Vinculo(Base):
    __tablename__ = "vinculos"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    responsavel_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    paciente_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("usuarios.id"), nullable=False
    )
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    responsavel = relationship(
        "Usuario",
        foreign_keys=[responsavel_id],
        back_populates="vinculos_como_responsavel",
    )
    paciente = relationship(
        "Usuario",
        foreign_keys=[paciente_id],
        back_populates="vinculos_como_paciente",
    )

    __table_args__ = (
        # Partial unique constraint: only one active vinculo per pair
        Index(
            "ix_vinculo_ativo_unique",
            "responsavel_id",
            "paciente_id",
            unique=True,
            postgresql_where=(ativo == True),
        ),
    )
