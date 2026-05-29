from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator


class VinculoCreate(BaseModel):
    paciente_id: int


class VinculoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    responsavel_id: int
    paciente_id: int
    paciente_nome: str | None = None
    paciente_email: str | None = None
    data_inicio: date
    data_fim: date | None = None
    ativo: bool

    @model_validator(mode="before")
    @classmethod
    def extract_nested_names(cls, data: Any) -> Any:
        """Extract paciente.nome and paciente.email from the ORM relationship if already loaded."""
        if hasattr(data, "__dict__") and "paciente" in data.__dict__:
            paciente = data.__dict__["paciente"]
            if paciente is not None:
                object.__setattr__(data, "paciente_nome", paciente.nome)
                object.__setattr__(data, "paciente_email", paciente.email)
        return data
