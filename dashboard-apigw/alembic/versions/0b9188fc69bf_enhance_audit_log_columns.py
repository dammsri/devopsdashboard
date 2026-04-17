"""Enhance audit log columns

Revision ID: 0b9188fc69bf
Revises: 06c0abfe914c
Create Date: 2026-04-12 12:52:53.260616

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0b9188fc69bf'
down_revision: Union[str, None] = '06c0abfe914c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('audit_logs', sa.Column('ip_address', sa.String(), nullable=True))
    op.add_column('audit_logs', sa.Column('metadata_json', sa.JSON(), nullable=True))
    # ### end Alembic commands ###


def downgrade() -> None:
    op.drop_column('audit_logs', 'metadata_json')
    op.drop_column('audit_logs', 'ip_address')
    # ### end Alembic commands ###
