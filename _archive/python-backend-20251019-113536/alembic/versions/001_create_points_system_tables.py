"""
Create points system database tables
Migration: 001_create_points_system_tables.py
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001_create_points_system_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """Create points system tables"""
    
    # Points configurations table
    op.create_table(
        'points_configurations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('entity_type', sa.String(length=20), nullable=False),
        sa.Column('entity_key', sa.String(length=100), nullable=False),
        sa.Column('config_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=True, server_default=sa.text('NOW()')),
        sa.Column('version', sa.Integer(), nullable=True, default=1),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('entity_type', 'entity_key', 'version'),
        sa.CheckConstraint('entity_type IN (\'exercise\', \'achievement\', \'rule\')', name='check_entity_type')
    )
    
    # Points history table
    op.create_table(
        'points_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('exercise_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('points_earned', sa.Integer(), nullable=False),
        sa.Column('calculation_breakdown', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('rule_ids', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True, server_default=sa.text('NOW()')),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # User achievements table
    op.create_table(
        'user_achievements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_type', sa.String(length=50), nullable=False),
        sa.Column('earned_at', sa.DateTime(), nullable=True, server_default=sa.text('NOW()')),
        sa.Column('points_awarded', sa.Integer(), nullable=True),
        sa.Column('notified', sa.Boolean(), nullable=True, default=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Leaderboards table
    op.create_table(
        'leaderboards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('period_type', sa.String(length=20), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('cache_data', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('last_updated', sa.DateTime(), nullable=True, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('period_type IN (\'daily\', \'weekly\', \'monthly\', \'all_time\')', name='check_period_type')
    )
    
    # Create indexes for performance
    op.create_index('idx_points_config_entity', 'points_configurations', ['entity_type', 'entity_key', 'is_active'])
    op.create_index('idx_points_config_active', 'points_configurations', ['is_active'])
    
    op.create_index('idx_points_history_user', 'points_history', ['user_id'])
    op.create_index('idx_points_history_date', 'points_history', ['created_at'])
    op.create_index('idx_points_history_points', 'points_history', ['points_earned'])
    op.create_index('idx_points_history_user_date', 'points_history', ['user_id', 'created_at'])
    
    op.create_index('idx_user_achievements_user', 'user_achievements', ['user_id'])
    op.create_index('idx_user_achievements_date', 'user_achievements', ['earned_at'])
    op.create_index('idx_user_achievements_user_type', 'user_achievements', ['user_id', 'achievement_type'])
    
    op.create_index('idx_leaderboards_period', 'leaderboards', ['period_type', 'period_start'])
    op.create_index('idx_leaderboards_updated', 'leaderboards', ['last_updated'])


def downgrade():
    """Drop points system tables"""
    op.drop_table('leaderboards')
    op.drop_table('user_achievements')
    op.drop_table('points_history')
    op.drop_table('points_configurations')