from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, model_validator

from app.modules.usuarios.models import NivelAutonomia, TipoUsuario


class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    telefone: str | None = None
    tipo: TipoUsuario

    # Campos específicos de PACIENTE
    data_nascimento: date | None = None
    obs_medicas: str | None = None
    nivel_autonomia: NivelAutonomia | None = None

    # Campos específicos de RESPONSAVEL/CUIDADOR
    grau_parentesco: str | None = None
    recebe_notificacoes: bool | None = None

    @model_validator(mode="after")
    def validate_conditional_fields(self) -> Self:
        if self.tipo == TipoUsuario.PACIENTE:
            if self.data_nascimento is None:
                raise ValueError("data_nascimento é obrigatório para PACIENTE")
            if self.obs_medicas is None:
                raise ValueError("obs_medicas é obrigatório para PACIENTE")
            if self.nivel_autonomia is None:
                raise ValueError("nivel_autonomia é obrigatório para PACIENTE")
        elif self.tipo in (TipoUsuario.RESPONSAVEL, TipoUsuario.CUIDADOR):
            if self.grau_parentesco is None:
                raise ValueError("grau_parentesco é obrigatório para RESPONSAVEL/CUIDADOR")
            if self.recebe_notificacoes is None:
                raise ValueError("recebe_notificacoes é obrigatório para RESPONSAVEL/CUIDADOR")
        return self


class UsuarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    email: str
    telefone: str | None = None
    tipo: TipoUsuario
    ativo: bool
    criado_em: datetime

    # Campos específicos de PACIENTE
    data_nascimento: date | None = None
    obs_medicas: str | None = None
    nivel_autonomia: NivelAutonomia | None = None

    # Campos específicos de RESPONSAVEL/CUIDADOR
    grau_parentesco: str | None = None
    recebe_notificacoes: bool | None = None

    push_token: str | None = None


class UsuarioUpdate(BaseModel):
    nome: str | None = None
    telefone: str | None = None
    obs_medicas: str | None = None
    grau_parentesco: str | None = None
    recebe_notificacoes: bool | None = None


class PushTokenUpdate(BaseModel):
    push_token: str
