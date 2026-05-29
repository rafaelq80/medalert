from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator

from app.modules.registros_tomada.models import StatusTomada


class RegistroTomadaResponse(BaseModel):
    id: int
    agenda_id: int
    paciente_id: int
    data_hora_prevista: datetime
    data_hora_confirmacao: datetime | None = None
    status: StatusTomada
    usuario_confirmacao_id: int | None = None
    medicamento_nome: str | None = None
    medicamento_dosagem: str | None = None
    medicamento_instrucoes: str | None = None
    tolerancia_minutos: int = 30

    model_config = ConfigDict(from_attributes=True)


class HistoricoAdesaoResponse(BaseModel):
    registros: list[RegistroTomadaResponse]
    total: int
    confirmados: int
    percentual_adesao: float
