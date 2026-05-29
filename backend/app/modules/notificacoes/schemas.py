from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.modules.notificacoes.models import TipoNotificacao


class NotificacaoResponse(BaseModel):
    id: int
    usuario_id: int
    registro_tomada_id: int | None = None
    tipo: TipoNotificacao
    enviado_em: datetime
    lido_em: datetime | None = None
    medicamento_nome: str | None = None
    paciente_nome: str | None = None
    horario_previsto: str | None = None

    model_config = ConfigDict(from_attributes=True)
