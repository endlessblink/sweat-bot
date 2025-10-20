"""Points System v3 - Optimized Schema

Revision ID: 002_points_v3
Revises: 001_create_points_system_tables
Create Date: 2025-01-10

This migration creates the optimized schema for Points System v3:
- Unified configuration table with JSONB
- Calculation audit trail
- Materialized view for performance
- Proper indexes for query optimization
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID
import uuid

# revision identifiers
revision = '002_points_v3'
down_revision = '001_create_points_system_tables'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Points Configuration Table (unified for exercises, rules, achievements)
    op.create_table(
        'points_configuration_v3',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('entity_type', sa.String(50), nullable=False),  # 'exercise', 'rule', 'achievement'
        sa.Column('entity_key', sa.String(100), nullable=False),  # e.g., 'squat', 'high_rep_bonus'
        sa.Column('config_data', JSONB, nullable=False),  # Full configuration
        sa.Column('version', sa.Integer, nullable=False, default=1),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.Column('created_by', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),

        # Composite unique constraint
        sa.UniqueConstraint('entity_type', 'entity_key', 'version', name='uq_config_entity_version')
    )

    # Indexes for configuration table
    op.create_index('idx_config_entity_active', 'points_configuration_v3',
                    ['entity_type', 'entity_key', 'is_active'])
    op.create_index('idx_config_entity_version', 'points_configuration_v3',
                    ['entity_type', 'entity_key', 'version'])
    op.create_index('idx_config_created_at', 'points_configuration_v3', ['created_at'])

    # 2. Points Calculations (audit trail with full context)
    op.create_table(
        'points_calculations_v3',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('exercise_id', UUID(as_uuid=True), nullable=True),  # FK to exercises table
        sa.Column('exercise_key', sa.String(100), nullable=False),  # e.g., 'squat'
        sa.Column('calculation_data', JSONB, nullable=False),  # Full breakdown
        sa.Column('points_earned', sa.Integer, nullable=False),
        sa.Column('rules_applied', JSONB, nullable=False),  # List of rule IDs
        sa.Column('configuration_version', sa.Integer, nullable=False),  # Which config version
        sa.Column('calculation_time_ms', sa.Float, nullable=True),  # Performance tracking
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),

        # Foreign key to exercises (if needed)
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], name='fk_calc_exercise')
    )

    # Indexes for calculations table
    op.create_index('idx_calc_user_created', 'points_calculations_v3',
                    ['user_id', 'created_at'])
    op.create_index('idx_calc_exercise', 'points_calculations_v3', ['exercise_id'])
    op.create_index('idx_calc_exercise_key', 'points_calculations_v3', ['exercise_key'])
    op.create_index('idx_calc_created_at', 'points_calculations_v3', ['created_at'])

    # 3. User Points Summary (materialized view for performance)
    op.execute("""
        CREATE MATERIALIZED VIEW user_points_summary_v3 AS
        SELECT
            user_id,
            SUM(points_earned) as total_points,
            COUNT(*) as total_calculations,
            MAX(created_at) as last_activity,
            COUNT(DISTINCT DATE(created_at)) as active_days,
            jsonb_agg(
                jsonb_build_object(
                    'exercise_key', exercise_key,
                    'points', points_earned,
                    'date', created_at
                ) ORDER BY created_at DESC
            ) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as recent_activity
        FROM points_calculations_v3
        GROUP BY user_id;
    """)

    # Index on materialized view
    op.create_index('idx_summary_user', 'user_points_summary_v3', ['user_id'], unique=True)
    op.create_index('idx_summary_total_points', 'user_points_summary_v3', ['total_points'])

    # 4. User Achievements Table
    op.create_table(
        'user_achievements_v3',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('achievement_id', sa.String(100), nullable=False),  # e.g., 'first_workout'
        sa.Column('achievement_name', sa.String(200), nullable=False),
        sa.Column('achievement_name_he', sa.String(200), nullable=False),
        sa.Column('points_awarded', sa.Integer, nullable=False),
        sa.Column('icon', sa.String(10), nullable=True),
        sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('metadata', JSONB, nullable=True),  # Additional context

        # Unique constraint - one achievement per user
        sa.UniqueConstraint('user_id', 'achievement_id', name='uq_user_achievement')
    )

    # Indexes for achievements table
    op.create_index('idx_achieve_user', 'user_achievements_v3', ['user_id'])
    op.create_index('idx_achieve_earned', 'user_achievements_v3', ['earned_at'])

    # 5. Leaderboard Cache Table
    op.create_table(
        'leaderboard_cache_v3',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('period_type', sa.String(20), nullable=False),  # 'all_time', 'weekly', 'monthly', 'daily'
        sa.Column('user_id', sa.String(100), nullable=False),
        sa.Column('username', sa.String(200), nullable=False),
        sa.Column('total_points', sa.Integer, nullable=False),
        sa.Column('rank_position', sa.Integer, nullable=False),
        sa.Column('level', sa.Integer, nullable=True),
        sa.Column('calculated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),  # TTL

        # Composite index for leaderboard queries
        sa.UniqueConstraint('period_type', 'user_id', name='uq_leaderboard_period_user')
    )

    # Indexes for leaderboard cache
    op.create_index('idx_leaderboard_period_rank', 'leaderboard_cache_v3',
                    ['period_type', 'rank_position'])
    op.create_index('idx_leaderboard_valid', 'leaderboard_cache_v3', ['valid_until'])

    # 6. Configuration Audit Log
    op.create_table(
        'points_config_audit_v3',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('config_id', UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(20), nullable=False),  # 'create', 'update', 'delete'
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_key', sa.String(100), nullable=False),
        sa.Column('old_config', JSONB, nullable=True),
        sa.Column('new_config', JSONB, nullable=True),
        sa.Column('changed_by', sa.String(100), nullable=False),
        sa.Column('changed_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('change_reason', sa.Text, nullable=True)
    )

    # Index for audit log
    op.create_index('idx_audit_config', 'points_config_audit_v3', ['config_id'])
    op.create_index('idx_audit_changed', 'points_config_audit_v3', ['changed_at'])
    op.create_index('idx_audit_entity', 'points_config_audit_v3', ['entity_type', 'entity_key'])

    # 7. Create function to refresh materialized view
    op.execute("""
        CREATE OR REPLACE FUNCTION refresh_user_points_summary()
        RETURNS void AS $$
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY user_points_summary_v3;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # 8. Create trigger to log configuration changes
    op.execute("""
        CREATE OR REPLACE FUNCTION log_config_change()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (TG_OP = 'UPDATE') THEN
                INSERT INTO points_config_audit_v3 (config_id, action, entity_type, entity_key, old_config, new_config, changed_by)
                VALUES (NEW.id, 'update', NEW.entity_type, NEW.entity_key,
                        row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.created_by);
            ELSIF (TG_OP = 'INSERT') THEN
                INSERT INTO points_config_audit_v3 (config_id, action, entity_type, entity_key, new_config, changed_by)
                VALUES (NEW.id, 'create', NEW.entity_type, NEW.entity_key,
                        row_to_json(NEW)::jsonb, NEW.created_by);
            ELSIF (TG_OP = 'DELETE') THEN
                INSERT INTO points_config_audit_v3 (config_id, action, entity_type, entity_key, old_config, changed_by)
                VALUES (OLD.id, 'delete', OLD.entity_type, OLD.entity_key,
                        row_to_json(OLD)::jsonb, OLD.created_by);
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)

    # Attach trigger to configuration table
    op.execute("""
        CREATE TRIGGER config_audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON points_configuration_v3
        FOR EACH ROW EXECUTE FUNCTION log_config_change();
    """)


def downgrade():
    # Drop trigger and function
    op.execute("DROP TRIGGER IF EXISTS config_audit_trigger ON points_configuration_v3;")
    op.execute("DROP FUNCTION IF EXISTS log_config_change();")
    op.execute("DROP FUNCTION IF EXISTS refresh_user_points_summary();")

    # Drop materialized view
    op.execute("DROP MATERIALIZED VIEW IF EXISTS user_points_summary_v3;")

    # Drop tables in reverse order
    op.drop_table('points_config_audit_v3')
    op.drop_table('leaderboard_cache_v3')
    op.drop_table('user_achievements_v3')
    op.drop_table('points_calculations_v3')
    op.drop_table('points_configuration_v3')
