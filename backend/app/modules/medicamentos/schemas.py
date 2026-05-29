from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, model_validator


class MedicamentoCreate(BaseModel):
    nome: str
    dosagem: str
    instrucoes: str
    uso_continuo: bool
    necessita_retorno: bool
    intervalo_retorno_dias: int | None = None
    categoria_id: int | None = None
    data_inicio_tratamento: date


class MedicamentoUpdate(BaseModel):
    nome: str | None = None
    dosagem: str | None = None
    instrucoes: str | None = None
    uso_continuo: bool | None = None
    necessita_retorno: bool | None = None
    intervalo_retorno_dias: int | None = None
    categoria_id: int | None = None


class MedicamentoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    paciente_id: int
    categoria_id: int | None = None
    categoria_nome: str | None = None
    nome: str
    dosagem: str
    instrucoes: str
    uso_continuo: bool
    necessita_retorno: bool
    intervalo_retorno_dias: int | None = None
    data_inicio_tratamento: date
    data_proximo_retorno: date | None = None
    retorno_realizado: bool | None = None
    data_retorno_realizado: date | None = None
    ativo: bool
    criado_em: datetime
    criado_por: int
    atualizado_em: datetime | None = None
    atualizado_por: int | None = None

    @model_validator(mode="before")
    @classmethod
    def extract_nested_names(cls, data: Any) -> Any:
        """Extract categoria.nome from the ORM relationship if already loaded."""
        if hasattr(data, "__dict__") and "categoria" in data.__dict__:
            cat = data.__dict__["categoria"]
            if cat is not None:
                object.__setattr__(data, "categoria_nome", cat.nome)
        return data


class CategoriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    descricao: str | None = None
