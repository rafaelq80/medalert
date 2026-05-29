import enum
from datetime import date, datetime, timezone

from sqlalchemy import BigInteger, Boolean, Date, DateTime, Enum, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TipoUsuario(str, enum.Enum):
    PACIENTE = "PACIENTE"
    RESPONSAVEL = "RESPONSAVEL"
    CUIDADOR = "CUIDADOR"
    ADMIN = "ADMIN"


class NivelAutonomia(str, enum.Enum):
    TOTAL = "TOTAL"
    PARCIAL = "PARCIAL"
    DEPENDENTE = "DEPENDENTE"


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    senha: Mapped[str] = mapped_column(String(255), nullable=False)
    tipo: Mapped[TipoUsuario] = mapped_column(Enum(TipoUsuario), nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Campos específicos de PACIENTE
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    obs_medicas: Mapped[str | None] = mapped_column(Text, nullable=True)
    nivel_autonomia: Mapped[NivelAutonomia | None] = mapped_column(
        Enum(NivelAutonomia), nullable=True
    )

    # Campos específicos de RESPONSAVEL/CUIDADOR
    grau_parentesco: Mapped[str | None] = mapped_column(String(100), nullable=True)
    recebe_notificacoes: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    # Push token
    push_token: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    vinculos_como_responsavel = relationship(
        "Vinculo",
        foreign_keys="Vinculo.responsavel_id",
        back_populates="responsavel",
        lazy="selectin",
    )
    vinculos_como_paciente = relationship(
        "Vinculo",
        foreign_keys="Vinculo.paciente_id",
        back_populates="paciente",
        lazy="selectin",
    )
    refresh_tokens = relationship("RefreshToken", back_populates="usuario", lazy="selectin")
