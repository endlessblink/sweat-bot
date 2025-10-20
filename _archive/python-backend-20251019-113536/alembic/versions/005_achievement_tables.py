"""Create achievement system tables

Revision ID: 005_achievement_tables
Revises: 004_aggregation_tables
Create Date: 2025-10-12

Creates tables for:
- Achievement definitions (40 achievements with declarative JSON conditions)
- User achievements (unlocked)
- Achievement progress tracking (real-time progress bars)
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '005_achievement_tables'
down_revision = '004_aggregation_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create achievement tables
    """

    print("Creating achievement tables...")

    # ========================================================================
    # ACHIEVEMENT_DEFINITION (40 Achievements)
    # ========================================================================

    op.create_table(
        'achievement_definition',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('key', sa.String(100), unique=True, nullable=False),
        sa.Column('name_en', sa.String(200), nullable=False),
        sa.Column('name_he', sa.String(200), nullable=False),
        sa.Column('description_en', sa.Text(), nullable=False),
        sa.Column('description_he', sa.Text(), nullable=False),
        sa.Column('category', postgresql.ENUM('milestone', 'skill', 'social', 'seasonal', 'streak', name='achievement_category'), nullable=False),
        sa.Column('tier', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('points_reward', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('icon_key', sa.String(20), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        # Declarative condition (NO eval!) - strictly parsed server-side
        sa.Column('condition_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.CheckConstraint('tier >= 1', name='chk_achievement_tier_positive'),
        sa.CheckConstraint('points_reward >= 0', name='chk_achievement_points_positive')
    )

    print("✅ Created achievement_definition")

    # ========================================================================
    # USER_ACHIEVEMENT (Unlocked Achievements)
    # ========================================================================

    op.create_table(
        'user_achievement',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_id', sa.Integer(), sa.ForeignKey('achievement_definition.id'), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('progress_value', sa.Numeric(precision=14, scale=4), nullable=False, server_default='0'),
        sa.Column('progress_target', sa.Numeric(precision=14, scale=4), nullable=False, server_default='0'),
        sa.UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement')
    )

    print("✅ Created user_achievement")

    # ========================================================================
    # USER_ACHIEVEMENT_PROGRESS (Real-time Progress Tracking)
    # ========================================================================

    op.create_table(
        'user_achievement_progress',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_id', sa.Integer(), sa.ForeignKey('achievement_definition.id'), nullable=False),
        sa.Column('progress_value', sa.Numeric(precision=14, scale=4), nullable=False, server_default='0'),
        sa.Column('progress_target', sa.Numeric(precision=14, scale=4), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('user_id', 'achievement_id', name='pk_user_achievement_progress')
    )

    print("✅ Created user_achievement_progress")

    # ========================================================================
    # CREATE INDEXES
    # ========================================================================

    print("Creating indexes for achievement tables...")

    # achievement_definition indexes
    op.create_index('idx_achievement_category', 'achievement_definition', ['category'])
    op.create_index('idx_achievement_tier', 'achievement_definition', ['category', 'tier'])
    op.create_index('idx_achievement_active', 'achievement_definition', ['is_active'])

    # user_achievement indexes
    op.create_index('idx_user_achievement_user', 'user_achievement', ['user_id'])
    op.create_index('idx_user_achievement_unlocked', 'user_achievement', ['user_id', 'unlocked_at'], postgresql_ops={'unlocked_at': 'DESC'})
    op.create_index('idx_user_achievement_definition', 'user_achievement', ['achievement_id'])

    # user_achievement_progress indexes
    op.create_index('idx_achievement_progress_user', 'user_achievement_progress', ['user_id'])
    op.create_index('idx_achievement_progress_updated', 'user_achievement_progress', ['user_id', 'updated_at'], postgresql_ops={'updated_at': 'DESC'})

    print("✅ Created 8 indexes for achievement tables")

    print("\n" + "="*60)
    print("✅ MIGRATION 005 COMPLETE")
    print("="*60)
    print("Created: 3 achievement tables")
    print("  - achievement_definition (40 achievements with JSON conditions)")
    print("  - user_achievement (unlocked achievements)")
    print("  - user_achievement_progress (real-time progress bars)")
    print("Created: 8 indexes")
    print("\nNOTE: Seed 40 achievements after running this migration")
    print("="*60)


def downgrade() -> None:
    """
    Rollback: Drop achievement tables
    """

    print("Rolling back achievement tables...")

    # Drop indexes
    op.drop_index('idx_achievement_progress_updated', 'user_achievement_progress')
    op.drop_index('idx_achievement_progress_user', 'user_achievement_progress')
    op.drop_index('idx_user_achievement_definition', 'user_achievement')
    op.drop_index('idx_user_achievement_unlocked', 'user_achievement')
    op.drop_index('idx_user_achievement_user', 'user_achievement')
    op.drop_index('idx_achievement_active', 'achievement_definition')
    op.drop_index('idx_achievement_tier', 'achievement_definition')
    op.drop_index('idx_achievement_category', 'achievement_definition')

    # Drop tables
    op.drop_table('user_achievement_progress')
    op.drop_table('user_achievement')
    op.drop_table('achievement_definition')

    print("✅ Rollback complete - achievement tables dropped")
