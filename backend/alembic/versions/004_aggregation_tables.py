"""Create aggregation tables for user stats, streaks, and PRs

Revision ID: 004_aggregation_tables
Revises: 003_points_v4
Create Date: 2025-10-12

Creates tables for:
- Daily stats rollups
- Lifetime summaries
- Personal records tracking
- Streak tracking with grace periods
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '004_aggregation_tables'
down_revision = '003_points_v4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create aggregation tables
    """

    print("Creating aggregation tables...")

    # ========================================================================
    # USER STATS DAILY (Daily Rollups)
    # ========================================================================

    op.create_table(
        'user_stats_daily',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('total_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_distance_km', sa.Numeric(precision=9, scale=3), nullable=False, server_default='0'),
        sa.Column('total_duration_sec', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('strength_volume_kg', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'),
        sa.Column('sets_completed', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('core_reps', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('core_duration_sec', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('activities_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('user_id', 'date', name='pk_user_stats_daily')
    )

    print("✅ Created user_stats_daily")

    # ========================================================================
    # USER STATS SUMMARY (Lifetime Aggregates)
    # ========================================================================

    op.create_table(
        'user_stats_summary',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('lifetime_points', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('lifetime_distance_km', sa.Numeric(precision=12, scale=3), nullable=False, server_default='0'),
        sa.Column('lifetime_duration_sec', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('lifetime_strength_kg', sa.Numeric(precision=14, scale=2), nullable=False, server_default='0'),
        sa.Column('lifetime_core_reps', sa.BigInteger(), nullable=False, server_default='0'),
        sa.Column('weekly_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('weekly_distance_km', sa.Numeric(precision=12, scale=3), nullable=False, server_default='0'),
        sa.Column('monthly_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    print("✅ Created user_stats_summary")

    # ========================================================================
    # USER PERSONAL RECORD (PR Tracking)
    # ========================================================================

    op.create_table(
        'user_personal_record',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_type_id', sa.Integer(), sa.ForeignKey('exercise_type.id'), nullable=False),
        sa.Column('metric_key', sa.String(100), nullable=False),  # '1rm_estimate', 'fastest_5k_sec', 'longest_plank_sec'
        sa.Column('metric_value', sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column('achieved_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('user_id', 'exercise_type_id', 'metric_key', name='uq_user_pr_metric')
    )

    print("✅ Created user_personal_record")

    # ========================================================================
    # USER STREAK (Streak Tracking with Grace Periods)
    # ========================================================================

    op.create_table(
        'user_streak',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('current_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('best_streak', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_active_date', sa.Date(), nullable=True),
        sa.Column('grace_tokens', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.CheckConstraint('current_streak >= 0', name='chk_current_streak_positive'),
        sa.CheckConstraint('best_streak >= 0', name='chk_best_streak_positive'),
        sa.CheckConstraint('grace_tokens >= 0', name='chk_grace_tokens_positive')
    )

    print("✅ Created user_streak")

    # ========================================================================
    # CREATE INDEXES
    # ========================================================================

    print("Creating indexes for aggregation tables...")

    # user_stats_daily indexes
    op.create_index('idx_user_stats_daily_points', 'user_stats_daily', ['user_id', 'total_points'], postgresql_ops={'total_points': 'DESC'})
    op.create_index('idx_user_stats_daily_date', 'user_stats_daily', ['user_id', 'date'], postgresql_ops={'date': 'DESC'})

    # user_stats_summary indexes
    op.create_index('idx_summary_lifetime_points', 'user_stats_summary', ['lifetime_points'], postgresql_ops={'lifetime_points': 'DESC'})
    op.create_index('idx_summary_weekly_points', 'user_stats_summary', ['weekly_points'], postgresql_ops={'weekly_points': 'DESC'})

    # user_personal_record indexes
    op.create_index('idx_pr_user_exercise', 'user_personal_record', ['user_id', 'exercise_type_id'])
    op.create_index('idx_pr_achieved_at', 'user_personal_record', ['achieved_at'], postgresql_ops={'achieved_at': 'DESC'})

    # user_streak indexes
    op.create_index('idx_streak_current', 'user_streak', ['current_streak'], postgresql_ops={'current_streak': 'DESC'})
    op.create_index('idx_streak_best', 'user_streak', ['best_streak'], postgresql_ops={'best_streak': 'DESC'})

    print("✅ Created 8 indexes for aggregation tables")

    print("\n" + "="*60)
    print("✅ MIGRATION 004 COMPLETE")
    print("="*60)
    print("Created: 4 aggregation tables")
    print("  - user_stats_daily (daily rollups)")
    print("  - user_stats_summary (lifetime aggregates)")
    print("  - user_personal_record (PR tracking)")
    print("  - user_streak (streaks with grace)")
    print("Created: 8 indexes")
    print("="*60)


def downgrade() -> None:
    """
    Rollback: Drop aggregation tables
    """

    print("Rolling back aggregation tables...")

    # Drop indexes
    op.drop_index('idx_streak_best', 'user_streak')
    op.drop_index('idx_streak_current', 'user_streak')
    op.drop_index('idx_pr_achieved_at', 'user_personal_record')
    op.drop_index('idx_pr_user_exercise', 'user_personal_record')
    op.drop_index('idx_summary_weekly_points', 'user_stats_summary')
    op.drop_index('idx_summary_lifetime_points', 'user_stats_summary')
    op.drop_index('idx_user_stats_daily_date', 'user_stats_daily')
    op.drop_index('idx_user_stats_daily_points', 'user_stats_daily')

    # Drop tables
    op.drop_table('user_streak')
    op.drop_table('user_personal_record')
    op.drop_table('user_stats_summary')
    op.drop_table('user_stats_daily')

    print("✅ Rollback complete - aggregation tables dropped")
