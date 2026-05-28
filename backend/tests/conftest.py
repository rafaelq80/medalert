"""
Pytest configuration and fixtures for MedAlert backend tests.
Uses aiosqlite for async SQLite in-memory database.
"""

import asyncio
from datetime import date, datetime, time, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import BigInteger
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

from app.core.database import Base
from app.core.dependencies import get_db
from app.core.security import hash_password, create_access_token
from app.modules.usuarios.models import NivelAutonomia, TipoUsuario, Usuario
from app.modules.vinculos.models import Vinculo
from app.modules.medicamentos.models import Categoria, Medicamento
from app.modules.agendas.models import Agenda, FrequenciaTomada
from app.modules.registros_tomada.models import RegistroTomada, StatusTomada
from app.modules.notificacoes.models import Notificacao, TipoNotificacao
from app.modules.auth.models import RefreshToken


# Make BigInteger compile as INTEGER in SQLite (needed for autoincrement PKs)
@compiles(BigInteger, "sqlite")
def compile_big_int_sqlite(type_, compiler, **kw):
    return "INTEGER"


# Use SQLite async in-memory database for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=engine_test,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session():
    """Create tables and provide a test database session."""
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """Provide an async HTTP test client with overridden DB dependency."""
    from app.main import app

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def paciente_user(db_session: AsyncSession) -> Usuario:
    """Create a PACIENTE user with all required fields."""
    user = Usuario(
        nome="Paciente Teste",
        email="paciente@test.com",
        senha=hash_password("senha123"),
        telefone="11999999999",
        tipo=TipoUsuario.PACIENTE,
        ativo=True,
        data_nascimento=date(1990, 5, 15),
        obs_medicas="Hipertensão controlada",
        nivel_autonomia=NivelAutonomia.PARCIAL,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def responsavel_user(db_session: AsyncSession) -> Usuario:
    """Create a RESPONSAVEL user with all required fields."""
    user = Usuario(
        nome="Responsável Teste",
        email="responsavel@test.com",
        senha=hash_password("senha123"),
        telefone="11988888888",
        tipo=TipoUsuario.RESPONSAVEL,
        ativo=True,
        grau_parentesco="Filho(a)",
        recebe_notificacoes=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def active_vinculo(
    db_session: AsyncSession, paciente_user: Usuario, responsavel_user: Usuario
) -> Vinculo:
    """Create an active vinculo between responsavel and paciente."""
    vinculo = Vinculo(
        responsavel_id=responsavel_user.id,
        paciente_id=paciente_user.id,
        data_inicio=date.today(),
        ativo=True,
    )
    db_session.add(vinculo)
    await db_session.commit()
    await db_session.refresh(vinculo)
    return vinculo


@pytest_asyncio.fixture
async def categoria(db_session: AsyncSession) -> Categoria:
    """Create a test medication category."""
    cat = Categoria(nome="Anti-hipertensivo", descricao="Medicamentos para pressão")
    db_session.add(cat)
    await db_session.commit()
    await db_session.refresh(cat)
    return cat


@pytest_asyncio.fixture
async def medicamento(
    db_session: AsyncSession, paciente_user: Usuario, categoria: Categoria
) -> Medicamento:
    """Create a test medicamento for the paciente."""
    med = Medicamento(
        paciente_id=paciente_user.id,
        categoria_id=categoria.id,
        nome="Losartana",
        dosagem="50mg",
        instrucoes="Tomar em jejum",
        uso_continuo=True,
        necessita_retorno=True,
        intervalo_retorno_dias=90,
        data_inicio_tratamento=date.today() - timedelta(days=30),
        data_proximo_retorno=date.today() + timedelta(days=5),
        ativo=True,
        criado_por=paciente_user.id,
    )
    db_session.add(med)
    await db_session.commit()
    await db_session.refresh(med)
    return med


@pytest_asyncio.fixture
async def agenda(db_session: AsyncSession, medicamento: Medicamento) -> Agenda:
    """Create a test agenda for the medicamento."""
    ag = Agenda(
        medicamento_id=medicamento.id,
        horario=time(8, 0),
        frequencia=FrequenciaTomada.DIARIA,
        tolerancia_minutos=30,
        data_inicio=date.today() - timedelta(days=7),
        ativo=True,
    )
    db_session.add(ag)
    await db_session.commit()
    await db_session.refresh(ag)
    return ag


def get_auth_headers(user: Usuario) -> dict:
    """Generate authorization headers for a user."""
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}
