import logging
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI

from app.scheduler.setup import scheduler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


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

# Include routers under /api/v1
from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.vinculos.router import router as vinculos_router
from app.modules.medicamentos.router import router as medicamentos_router
from app.modules.medicamentos.categorias_router import router as categorias_router
from app.modules.agendas.router import router as agendas_router
from app.modules.registros_tomada.router import router as registros_tomada_router
from app.modules.notificacoes.router import router as notificacoes_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(usuarios_router, prefix="/usuarios", tags=["Usuários"])
api_router.include_router(vinculos_router, prefix="/vinculos", tags=["Vínculos"])
api_router.include_router(medicamentos_router, tags=["Medicamentos"])
api_router.include_router(categorias_router, prefix="/categorias", tags=["Categorias"])
api_router.include_router(agendas_router, tags=["Agendas"])
api_router.include_router(registros_tomada_router, tags=["Registros de Tomada"])
api_router.include_router(notificacoes_router, tags=["Notificações"])

app.include_router(api_router)


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
