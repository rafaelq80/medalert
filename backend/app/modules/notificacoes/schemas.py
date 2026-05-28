from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.notificacoes.models import TipoNotificacao


class NotificacaoResponse(BaseModel):
    id: int
    usuario_id: int
    registro_tomada_id: int | None = None
    tipo: TipoNotificacao
    enviado_em: datetime
    lido_em: datetime | None = None

    model_config = ConfigDict(from_attributes=True)
