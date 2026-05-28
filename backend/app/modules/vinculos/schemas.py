from datetime import date

from pydantic import BaseModel, ConfigDict


class VinculoCreate(BaseModel):
    paciente_id: int


class VinculoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    responsavel_id: int
    paciente_id: int
    data_inicio: date
    data_fim: date | None = None
    ativo: bool
