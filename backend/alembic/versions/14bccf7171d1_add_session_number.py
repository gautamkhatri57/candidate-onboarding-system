"""add session number

Revision ID: 14bccf7171d1
Revises: abe7505c134c
Create Date: 2026-09-15 15:21:08.103037

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14bccf7171d1'
down_revision: Union[str, Sequence[str], None] = 'abe7505c134c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    # 1. Add column temporarily allowing NULL
    op.add_column(
        'interview_sessions',
        sa.Column(
            'session_number',
            sa.Integer(),
            nullable=True
        )
    )

    # 2. Give each candidate's sessions a sequential number
    op.execute(
        """
        UPDATE interview_sessions
        SET session_number = numbered.session_number
        FROM (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY candidate_id
                    ORDER BY id
                ) AS session_number
            FROM interview_sessions
        ) AS numbered
        WHERE interview_sessions.id = numbered.id
        """
    )

    # 3. Make column required
    op.alter_column(
        'interview_sessions',
        'session_number',
        existing_type=sa.Integer(),
        nullable=False
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        'interview_sessions',
        'session_number'
    )