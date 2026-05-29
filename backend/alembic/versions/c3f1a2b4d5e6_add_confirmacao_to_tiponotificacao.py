"""add_confirmacao_to_tiponotificacao

Revision ID: c3f1a2b4d5e6
Revises: 412d6314acb8
Create Date: 2026-05-29 05:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'c3f1a2b4d5e6'
down_revision: Union[str, None] = '412d6314acb8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE tiponotificacao ADD VALUE IF NOT EXISTS 'CONFIRMACAO'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from an enum type.
    pass
