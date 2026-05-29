"""
Seed script for initial data (convenience wrapper).
Run with: python seed.py
"""
import asyncio
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.modules.medicamentos.models import Categoria
from app.modules.usuarios.models import Usuario, TipoUsuario, NivelAutonomia
# Import all models to resolve relationships
from app.modules.agendas.models import Agenda  # noqa: F401
from app.modules.registros_tomada.models import RegistroTomada  # noqa: F401
from app.modules.notificacoes.models import Notificacao  # noqa: F401
from app.modules.vinculos.models import Vinculo  # noqa: F401
from app.modules.auth.models import RefreshToken  # noqa: F401


CATEGORIAS = [
    {"nome": "Analgésico", "descricao": "Medicamentos para alívio da dor"},
    {"nome": "Anti-inflamatório", "descricao": "Medicamentos para redução de inflamação"},
    {"nome": "Antibiótico", "descricao": "Medicamentos para combate a infecções bacterianas"},
    {"nome": "Antidepressivo", "descricao": "Medicamentos para tratamento de depressão"},
    {"nome": "Anti-hipertensivo", "descricao": "Medicamentos para controle da pressão arterial"},
    {"nome": "Antidiabético", "descricao": "Medicamentos para controle do diabetes"},
    {"nome": "Vitamina/Suplemento", "descricao": "Vitaminas e suplementos alimentares"},
    {"nome": "Cardiovascular", "descricao": "Medicamentos para o sistema cardiovascular"},
    {"nome": "Gastrointestinal", "descricao": "Medicamentos para o sistema digestivo"},
    {"nome": "Outro", "descricao": "Outras categorias de medicamentos"},
]

USUARIOS = [
    {
        "nome": "Administrador",
        "email": "admin@email.com.br",
        "senha": "admin123",
        "tipo": TipoUsuario.ADMIN,
        "telefone": None,
        "data_nascimento": None,
        "obs_medicas": None,
        "nivel_autonomia": None,
        "grau_parentesco": None,
        "recebe_notificacoes": None,
    },
    {
        "nome": "Paciente 01",
        "email": "paciente01@email.com.br",
        "senha": "123456",
        "tipo": TipoUsuario.PACIENTE,
        "telefone": "(11) 99999-0001",
        "data_nascimento": date(1955, 3, 15),
        "obs_medicas": "Hipertensão, diabetes tipo 2",
        "nivel_autonomia": NivelAutonomia.PARCIAL,
        "grau_parentesco": None,
        "recebe_notificacoes": None,
    },
    {
        "nome": "Paciente 02",
        "email": "paciente02@email.com.br",
        "senha": "123456",
        "tipo": TipoUsuario.PACIENTE,
        "telefone": "(11) 99999-0002",
        "data_nascimento": date(1948, 7, 22),
        "obs_medicas": "Artrite reumatoide, alergia a dipirona",
        "nivel_autonomia": NivelAutonomia.DEPENDENTE,
        "grau_parentesco": None,
        "recebe_notificacoes": None,
    },
    {
        "nome": "Responsável 01",
        "email": "responsavel01@email.com.br",
        "senha": "123456",
        "tipo": TipoUsuario.RESPONSAVEL,
        "telefone": "(11) 99999-0003",
        "data_nascimento": None,
        "obs_medicas": None,
        "nivel_autonomia": None,
        "grau_parentesco": "Filho(a)",
        "recebe_notificacoes": True,
    },
    {
        "nome": "Cuidador",
        "email": "cuidador@email.com.br",
        "senha": "123456",
        "tipo": TipoUsuario.CUIDADOR,
        "telefone": "(11) 99999-0004",
        "data_nascimento": None,
        "obs_medicas": None,
        "nivel_autonomia": None,
        "grau_parentesco": "Enfermeiro(a)",
        "recebe_notificacoes": True,
    },
]


async def seed():
    async with AsyncSessionLocal() as db:
        # Seed categorias
        print("Seeding categorias...")
        for cat_data in CATEGORIAS:
            result = await db.execute(
                select(Categoria).where(Categoria.nome == cat_data["nome"])
            )
            existing = result.scalar_one_or_none()
            if existing is None:
                categoria = Categoria(**cat_data)
                db.add(categoria)
                print(f"  ✓ Categoria: {cat_data['nome']}")
            else:
                print(f"  - Já existe: {cat_data['nome']}")

        await db.commit()

        # Seed usuários
        print("\nSeeding usuários...")
        for user_data in USUARIOS:
            result = await db.execute(
                select(Usuario).where(Usuario.email == user_data["email"])
            )
            existing = result.scalar_one_or_none()
            if existing is None:
                data = {**user_data}
                data["senha"] = hash_password(data["senha"])
                usuario = Usuario(**data)
                db.add(usuario)
                print(f"  ✓ {data['tipo'].value}: {data['nome']} ({data['email']})")
            else:
                print(f"  - Já existe: {user_data['nome']} ({user_data['email']})")

        await db.commit()
        print("\n✅ Seed completed!")


if __name__ == "__main__":
    print("=" * 50)
    print("MedAlert — Seed Database")
    print("=" * 50)
    asyncio.run(seed())
