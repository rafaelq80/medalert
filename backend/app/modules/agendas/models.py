import enum
from datetime import date, time

from sqlalchemy import BigInteger, Boolean, Date, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FrequenciaTomada(str, enum.Enum):
    DIARIA = "DIARIA"
    SEMANAL = "SEMANAL"
    PERSONALIZADA = "PERSONALIZADA"


class Agenda(Base):
    __tablename__ = "agendas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    medicamento_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("medicamentos.id"), nullable=False
    )
    horario: Mapped[time] = mapped_column(Time, nullable=False)
    frequencia: Mapped[FrequenciaTomada] = mapped_column(
        Enum(FrequenciaTomada), nullable=False
    )
    dias_semana: Mapped[str | None] = mapped_column(String(20), nullable=True)
    tolerancia_minutos: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    data_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    data_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Relationships
    medicamento = relationship("Medicamento", back_populates="agendas")
    registros_tomada = relationship("RegistroTomada", back_populates="agenda", lazy="selectin")
