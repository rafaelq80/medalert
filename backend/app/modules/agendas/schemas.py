from datetime import date, time
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.agendas.models import FrequenciaTomada


class AgendaCreate(BaseModel):
    horario: time
    frequencia: FrequenciaTomada
    dias_semana: str | None = Field(default=None, max_length=20, pattern=r"^[1-7](,[1-7])*$")
    tolerancia_minutos: int = Field(default=30, ge=1, le=120)
    data_inicio: date
    data_fim: date | None = None

    @model_validator(mode="after")
    def validate_dias_semana(self) -> Self:
        if self.frequencia in (FrequenciaTomada.SEMANAL, FrequenciaTomada.PERSONALIZADA):
            if not self.dias_semana:
                raise ValueError(
                    "dias_semana é obrigatório quando frequência é SEMANAL ou PERSONALIZADA"
                )
        return self


class AgendaUpdate(BaseModel):
    horario: time | None = None
    frequencia: FrequenciaTomada | None = None
    dias_semana: str | None = Field(default=None, max_length=20, pattern=r"^[1-7](,[1-7])*$")
    tolerancia_minutos: int | None = Field(default=None, ge=1, le=120)
    data_inicio: date | None = None
    data_fim: date | None = None


class AgendaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    medicamento_id: int
    horario: time
    frequencia: FrequenciaTomada
    dias_semana: str | None = None
    tolerancia_minutos: int
    data_inicio: date
    data_fim: date | None = None
    ativo: bool
