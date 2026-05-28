"""
Seed script for initial data.
Run with: python -m scripts.seed
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import select
from app.core.database import AsyncSessionLocal

# Import all models to register them with SQLAlchemy
from app.modules.usuarios.models import Usuario  # noqa: F401
from app.modules.auth.models import RefreshToken  # noqa: F401
from app.modules.vinculos.models import Vinculo  # noqa: F401
from app.modules.medicamentos.models import Categoria, Medicamento  # noqa: F401
from app.modules.agendas.models import Agenda  # noqa: F401
from app.modules.registros_tomada.models import RegistroTomada  # noqa: F401
from app.modules.notificacoes.models import Notificacao  # noqa: F401


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


async def seed():
    async with AsyncSessionLocal() as db:
        for cat_data in CATEGORIAS:
            result = await db.execute(
                select(Categoria).where(Categoria.nome == cat_data["nome"])
            )
            existing = result.scalar_one_or_none()
            if existing is None:
                categoria = Categoria(**cat_data)
                db.add(categoria)
                print(f"  Created: {cat_data['nome']}")
            else:
                print(f"  Already exists: {cat_data['nome']}")

        await db.commit()
        print("\nSeed completed!")


if __name__ == "__main__":
    print("Seeding database with initial categories...")
    asyncio.run(seed())
