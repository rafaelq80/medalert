from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.registros_tomada.models import StatusTomada


class RegistroTomadaResponse(BaseModel):
    id: int
    agenda_id: int
    paciente_id: int
    data_hora_prevista: datetime
    data_hora_confirmacao: datetime | None = None
    status: StatusTomada
    usuario_confirmacao_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class HistoricoAdesaoResponse(BaseModel):
    registros: list[RegistroTomadaResponse]
    total: int
    confirmados: int
    percentual_adesao: float
