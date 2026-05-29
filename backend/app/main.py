import json
import logging
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from fastapi import APIRouter, FastAPI, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request

from app.core.config import settings
from app.scheduler.setup import scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Local timezone for response serialization
LOCAL_TZ = ZoneInfo(settings.TIMEZONE)


class TimezoneMiddleware(BaseHTTPMiddleware):
    """Middleware that converts UTC datetimes in JSON responses to local timezone."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        # Only process JSON responses
        if "application/json" not in response.headers.get("content-type", ""):
            return response

        # Read the response body
        body_chunks = []
        async for chunk in response.body_iterator:
            if isinstance(chunk, bytes):
                body_chunks.append(chunk)
            else:
                body_chunks.append(chunk.encode())

        body = b"".join(body_chunks)

        try:
            data = json.loads(body)
            converted = self._convert_datetimes(data)
            new_body = json.dumps(converted, default=self._json_default, ensure_ascii=False)
            # Remove content-length from original headers (will be recalculated)
            headers = {
                k: v for k, v in response.headers.items()
                if k.lower() != "content-length"
            }
            return Response(
                content=new_body,
                status_code=response.status_code,
                headers=headers,
                media_type="application/json",
            )
        except (json.JSONDecodeError, TypeError):
            return Response(
                content=body,
                status_code=response.status_code,
                headers={
                    k: v for k, v in response.headers.items()
                    if k.lower() != "content-length"
                },
                media_type="application/json",
            )

    def _convert_datetimes(self, obj):
        """Recursively find ISO datetime strings and convert from UTC to local."""
        if isinstance(obj, dict):
            return {k: self._convert_datetimes(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_datetimes(item) for item in obj]
        elif isinstance(obj, str):
            return self._try_convert_datetime_str(obj)
        return obj

    def _try_convert_datetime_str(self, s: str) -> str:
        """Try to parse an ISO datetime string and convert to local timezone."""
        # Match patterns like "2026-05-29T06:11:00+00:00" or "2026-05-29T06:11:00Z"
        if 'T' not in s or len(s) < 19:
            return s

        try:
            # Only convert if it has timezone info (UTC)
            if s.endswith('Z') or '+' in s[19:] or (len(s) > 19 and s[19] == '-'):
                dt = datetime.fromisoformat(s.replace('Z', '+00:00'))
                local_dt = dt.astimezone(LOCAL_TZ)
                return local_dt.strftime("%Y-%m-%dT%H:%M:%S")
        except (ValueError, IndexError):
            pass
        return s

    def _json_default(self, obj):
        if isinstance(obj, datetime):
            if obj.tzinfo is not None:
                return obj.astimezone(LOCAL_TZ).strftime("%Y-%m-%dT%H:%M:%S")
            return obj.strftime("%Y-%m-%dT%H:%M:%S")
        if isinstance(obj, date):
            return obj.isoformat()
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting MedAlert scheduler...")
    scheduler.start()
    logger.info("Scheduler started successfully")
    yield
    # Shutdown
    logger.info("Shutting down MedAlert scheduler...")
    scheduler.shutdown(wait=False)
    logger.info("Scheduler shut down")


app = FastAPI(
    title="MedAlert API",
    description="Backend para gerenciamento de medicamentos e lembretes",
    version="1.0.0",
    lifespan=lifespan,
)

# Add timezone conversion middleware
app.add_middleware(TimezoneMiddleware)

# Include routers under /api/v1
from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.vinculos.router import router as vinculos_router
from app.modules.medicamentos.router import router as medicamentos_router
from app.modules.medicamentos.categorias_router import router as categorias_router
from app.modules.agendas.router import router as agendas_router
from app.modules.registros_tomada.router import router as registros_tomada_router
from app.modules.notificacoes.router import router as notificacoes_router
from app.modules.admin.router import router as admin_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(usuarios_router, prefix="/usuarios", tags=["Usuários"])
api_router.include_router(vinculos_router, prefix="/vinculos", tags=["Vínculos"])
api_router.include_router(medicamentos_router, tags=["Medicamentos"])
api_router.include_router(categorias_router, prefix="/categorias", tags=["Categorias"])
api_router.include_router(agendas_router, tags=["Agendas"])
api_router.include_router(registros_tomada_router, tags=["Registros de Tomada"])
api_router.include_router(notificacoes_router, tags=["Notificações"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin"])

app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
