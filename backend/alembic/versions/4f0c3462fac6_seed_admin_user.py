"""seed_admin_user

Revision ID: 4f0c3462fac6
Revises: c3f1a2b4d5e6
Create Date: 2026-07-28 00:00:00.000000

"""
from typing import Sequence, Union

import bcrypt
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = '4f0c3462fac6'
down_revision: Union[str, None] = 'c3f1a2b4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

ADMIN_EMAIL = "admin@email.com.br"
ADMIN_SENHA_PADRAO = "admin123"


def _hash_password(password: str) -> str:
    # Mesma lógica de app/core/security.py::hash_password
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def upgrade() -> None:
    conn = op.get_bind()
    senha_hash = _hash_password(ADMIN_SENHA_PADRAO)

    # Idempotente: não insere de novo se o e-mail já existir (constraint unique em usuarios.email)
    conn.execute(
        sa.text(
            """
            INSERT INTO usuarios (nome, email, telefone, senha, tipo, ativo, criado_em)
            VALUES (:nome, :email, NULL, :senha, 'ADMIN', TRUE, now())
            ON CONFLICT (email) DO NOTHING
            """
        ),
        {
            "nome": "Administrador",
            "email": ADMIN_EMAIL,
            "senha": senha_hash,
        },
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM usuarios WHERE email = :email"),
        {"email": ADMIN_EMAIL},
    )
