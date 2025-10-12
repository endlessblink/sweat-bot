"""Archive v3 tables and create Points System v4.0 schema

Revision ID: 003_points_v4
Revises: 002_points_system_v3_schema
Create Date: 2025-10-12

This migration:
1. Archives all v3 tables with _archive suffix (safety net)
2. Creates fresh v4 schema with normalized data model
3. Implements production-ready gamification system

Based on comprehensive Perplexity AI analysis and industry best practices.
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '003_points_v4'
down_revision = '002_points_system_v3_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Archive v3 and create v4 schema
    """

    # ========================================================================
    # PHASE 1: ARCHIVE V3 TABLES (Safety Net)
    # ========================================================================

    print("Archiving v3 tables for safety...")

    # Rename all v3 tables to _archive suffix
    v3_tables = [
        'points_configuration_v3',
        'points_calculations_v3',
        'user_points_summary_v3',
        'user_achievements_v3',
        'leaderboard_cache_v3',
        'points_config_audit_v3'
    ]

    for table in v3_tables:
        op.execute(f'ALTER TABLE IF EXISTS {table} RENAME TO {table}_archive')

    print(f"✅ Archived {len(v3_tables)} v3 tables")

    # ========================================================================
    # PHASE 2: CREATE ENUMS
    # ========================================================================

    print("Creating enums...")

    # Exercise category enum
    op.execute("CREATE TYPE exercise_category AS ENUM ('strength', 'cardio', 'core')")

    # Achievement category enum
    op.execute("CREATE TYPE achievement_category AS ENUM ('milestone', 'skill', 'social', 'seasonal', 'streak')")

    # Leaderboard scope enum
    op.execute("CREATE TYPE leaderboard_scope AS ENUM ('all_time', 'weekly', 'monthly', 'friends')")

    # Challenge type enum
    op.execute("CREATE TYPE challenge_type AS ENUM ('distance', 'points', 'streak', 'volume')")

    print("✅ Created 4 enums")

    # ========================================================================
    # PHASE 3: CORE ACTIVITY TABLES
    # ========================================================================

    print("Creating core activity tables...")

    # Exercise types (reference data)
    op.create_table(
        'exercise_type',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('key', sa.String(100), unique=True, nullable=False),
        sa.Column('category', postgresql.ENUM('strength', 'cardio', 'core', name='exercise_category'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False)
    )

    # Activity log (immutable exercise logs)
    op.create_table(
        'activity_log',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_type_id', sa.Integer(), sa.ForeignKey('exercise_type.id'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('source', sa.String(100), nullable=False, server_default='manual'),
        sa.Column('is_valid', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('ended_at > started_at', name='chk_activity_time_valid'),
        sa.CheckConstraint("ended_at - started_at < INTERVAL '8 hours'", name='chk_activity_duration_reasonable')
    )

    # Strength activity details (sets/reps/weight)
    op.create_table(
        'activity_strength_set',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('activity_id', sa.BigInteger(), sa.ForeignKey('activity_log.id', ondelete='CASCADE'), nullable=False),
        sa.Column('set_index', sa.Integer(), nullable=False),
        sa.Column('reps', sa.Integer(), nullable=False),
        sa.Column('weight_kg', sa.Numeric(precision=6, scale=2), nullable=False),
        sa.Column('rpe', sa.Numeric(precision=3, scale=1), nullable=True),
        sa.Column('tempo', sa.String(20), nullable=True),
        sa.CheckConstraint('reps >= 0', name='chk_strength_reps_positive'),
        sa.CheckConstraint('weight_kg >= 0', name='chk_strength_weight_positive')
    )

    # Cardio activity details (distance/pace/HR)
    op.create_table(
        'activity_cardio',
        sa.Column('activity_id', sa.BigInteger(), sa.ForeignKey('activity_log.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('distance_km', sa.Numeric(precision=7, scale=3), nullable=False),
        sa.Column('duration_sec', sa.Integer(), nullable=False),
        sa.Column('avg_hr', sa.Integer(), nullable=True),
        sa.Column('elevation_gain_m', sa.Integer(), nullable=False, server_default='0'),
        sa.CheckConstraint('distance_km >= 0', name='chk_cardio_distance_positive'),
        sa.CheckConstraint('duration_sec > 0', name='chk_cardio_duration_positive'),
        sa.CheckConstraint('elevation_gain_m >= 0', name='chk_cardio_elevation_positive')
    )

    # Core activity details (duration/reps)
    op.create_table(
        'activity_core',
        sa.Column('activity_id', sa.BigInteger(), sa.ForeignKey('activity_log.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('duration_sec', sa.Integer(), nullable=True),
        sa.Column('variant', sa.String(100), nullable=True),
        sa.CheckConstraint('reps >= 0 OR reps IS NULL', name='chk_core_reps_positive'),
        sa.CheckConstraint('duration_sec >= 0 OR duration_sec IS NULL', name='chk_core_duration_positive')
    )

    print("✅ Created 4 core activity tables")

    # ========================================================================
    # PHASE 4: POINTS CALCULATION TABLE
    # ========================================================================

    print("Creating points calculation table...")

    op.create_table(
        'points_calculation',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('activity_id', sa.BigInteger(), sa.ForeignKey('activity_log.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_type_id', sa.Integer(), sa.ForeignKey('exercise_type.id'), nullable=False),
        sa.Column('base_points', sa.Integer(), nullable=False),
        sa.Column('bonus_points', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('multiplier', sa.Numeric(precision=4, scale=2), nullable=False, server_default='1.00'),
        # Generated column for total_points
        sa.Column('total_points', sa.Integer(), sa.Computed('FLOOR((base_points + bonus_points) * multiplier)'), nullable=False),
        sa.Column('breakdown_json', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    print("✅ Created points_calculation table with computed total_points column")

    # ========================================================================
    # PHASE 5: CREATE INDEXES (Core Tables)
    # ========================================================================

    print("Creating indexes for core tables...")

    # Activity log indexes
    op.create_index('idx_activity_user_exercise_time', 'activity_log', ['user_id', 'exercise_type_id', 'started_at'], postgresql_using='btree', postgresql_ops={'started_at': 'DESC'})
    op.create_index('idx_activity_user_started', 'activity_log', ['user_id', 'started_at'], postgresql_ops={'started_at': 'DESC'})
    op.create_index('idx_activity_created_at', 'activity_log', ['created_at'], postgresql_ops={'created_at': 'DESC'})

    # Points calculation indexes
    op.create_index('idx_points_user_calculated_at', 'points_calculation', ['user_id', 'calculated_at'], postgresql_ops={'calculated_at': 'DESC'})
    op.create_index('idx_points_total_points', 'points_calculation', ['total_points'], postgresql_ops={'total_points': 'DESC'})
    op.create_index('idx_points_activity_time', 'points_calculation', ['user_id', 'exercise_type_id', 'calculated_at'], postgresql_ops={'calculated_at': 'DESC'})

    print("✅ Created 6 indexes for core tables")

    print("\n" + "="*60)
    print("✅ MIGRATION 003 COMPLETE")
    print("="*60)
    print(f"Archived: 6 v3 tables → *_archive")
    print(f"Created: 4 enums")
    print(f"Created: 5 core tables (exercise_type, activity_log, activity_strength_set, activity_cardio, activity_core, points_calculation)")
    print(f"Created: 6 indexes")
    print(f"\nNext: Run migrations 004-006 for aggregations, achievements, and social features")
    print("="*60)


def downgrade() -> None:
    """
    Rollback: Drop v4 tables and restore v3 tables
    """

    print("Rolling back v4 migration...")

    # Drop indexes
    op.drop_index('idx_points_activity_time', 'points_calculation')
    op.drop_index('idx_points_total_points', 'points_calculation')
    op.drop_index('idx_points_user_calculated_at', 'points_calculation')
    op.drop_index('idx_activity_created_at', 'activity_log')
    op.drop_index('idx_activity_user_started', 'activity_log')
    op.drop_index('idx_activity_user_exercise_time', 'activity_log')

    # Drop tables (reverse order due to foreign keys)
    op.drop_table('points_calculation')
    op.drop_table('activity_core')
    op.drop_table('activity_cardio')
    op.drop_table('activity_strength_set')
    op.drop_table('activity_log')
    op.drop_table('exercise_type')

    # Drop enums
    op.execute('DROP TYPE IF EXISTS challenge_type')
    op.execute('DROP TYPE IF EXISTS leaderboard_scope')
    op.execute('DROP TYPE IF EXISTS achievement_category')
    op.execute('DROP TYPE IF EXISTS exercise_category')

    # Restore v3 tables
    v3_tables = [
        'points_configuration_v3',
        'points_calculations_v3',
        'user_points_summary_v3',
        'user_achievements_v3',
        'leaderboard_cache_v3',
        'points_config_audit_v3'
    ]

    for table in v3_tables:
        op.execute(f'ALTER TABLE IF EXISTS {table}_archive RENAME TO {table}')

    print("✅ Rollback complete - v3 tables restored")
