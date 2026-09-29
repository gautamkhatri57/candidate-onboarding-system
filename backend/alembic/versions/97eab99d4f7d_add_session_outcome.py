"""add session outcome

Revision ID: 97eab99d4f7d
Revises: 14bccf7171d1
Create Date: 2026-09-15 15:52:29.875568

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '97eab99d4f7d'
down_revision: Union[str, Sequence[str], None] = '14bccf7171d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    session_outcome = postgresql.ENUM(
        'PASS',
        'REMEDIAL',
        'REJECT',
        name='sessionoutcome'
    )

    session_outcome.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'interview_sessions',
        sa.Column(
            'outcome',
            session_outcome,
            nullable=True
        )
    )


def downgrade() -> None:
    op.drop_column(
        'interview_sessions',
        'outcome'
    )

    session_outcome = postgresql.ENUM(
        'PASS',
        'REMEDIAL',
        'REJECT',
        name='sessionoutcome'
    )

    session_outcome.drop(op.get_bind(), checkfirst=True)