"""add_admin_to_tipousuario

Revision ID: 412d6314acb8
Revises: a82ebcf6521b
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '412d6314acb8'
down_revision: Union[str, None] = 'a82ebcf6521b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add ADMIN value to the tipousuario enum in PostgreSQL.
    # IF NOT EXISTS makes this idempotent (PostgreSQL 9.3+).
    op.execute("ALTER TYPE tipousuario ADD VALUE IF NOT EXISTS 'ADMIN'")


def downgrade() -> None:
    # PostgreSQL does not support removing values from an enum type.
    # A downgrade would require recreating the enum and all dependent columns,
    # which is destructive. This is intentionally left as a no-op.
    pass
