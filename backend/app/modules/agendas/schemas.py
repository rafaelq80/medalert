from datetime import date, time
from typing import Self

from pydantic import BaseModel, ConfigDict, model_validator

from app.modules.agendas.models import FrequenciaTomada


class AgendaCreate(BaseModel):
    horario: time
    frequencia: FrequenciaTomada
    dias_semana: str | None = None
    tolerancia_minutos: int = 30
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
    dias_semana: str | None = None
    tolerancia_minutos: int | None = None
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
