from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.modules.usuarios.models import TipoUsuario


class UsuarioAdminResponse(BaseModel):
    id: int
    nome: str
    email: str
    tipo: TipoUsuario
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


class UsuarioDetalheAdminResponse(BaseModel):
    id: int
    nome: str
    email: str
    telefone: str | None = None
    tipo: TipoUsuario
    ativo: bool
    criado_em: datetime
    # Campos de PACIENTE
    data_nascimento: date | None = None
    obs_medicas: str | None = None
    nivel_autonomia: str | None = None
    # Campos de RESPONSAVEL/CUIDADOR
    grau_parentesco: str | None = None
    recebe_notificacoes: bool | None = None

    model_config = {"from_attributes": True}


class PaginatedUsuariosResponse(BaseModel):
    items: list[UsuarioAdminResponse]
    total: int
    page: int
    size: int


class AlterarTipoRequest(BaseModel):
    novo_tipo: TipoUsuario


class CategoriaCreateRequest(BaseModel):
    nome: str = Field(max_length=100)
    descricao: str | None = None


class CategoriaUpdateRequest(BaseModel):
    nome: str | None = Field(default=None, max_length=100)
    descricao: str | None = None


class MetricasResponse(BaseModel):
    usuarios_por_tipo: dict[str, int]
    usuarios_ativos: int
    vinculos_ativos: int
    taxa_adesao_30d: float
    registros_atrasados_30d: int
    registros_ignorados_30d: int


class ForcarLogoutResponse(BaseModel):
    tokens_revogados: int
