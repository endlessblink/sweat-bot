"""Create social and leaderboard tables

Revision ID: 006_social_leaderboard
Revises: 005_achievement_tables
Create Date: 2025-10-12

Creates tables for:
- Friends system
- Teams and team members
- Challenges (distance, points, volume, streak)
- Challenge participants
- Leaderboard cache
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '006_social_leaderboard'
down_revision = '005_achievement_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create social and leaderboard tables
    """

    print("Creating social and leaderboard tables...")

    # ========================================================================
    # SOCIAL_FRIEND (Friend Connections)
    # ========================================================================

    op.create_table(
        'social_friend',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('friend_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('user_id', 'friend_user_id', name='pk_social_friend'),
        sa.CheckConstraint("status IN ('pending', 'accepted', 'blocked')", name='chk_friend_status_valid')
    )

    print("✅ Created social_friend")

    # ========================================================================
    # TEAM (Workout Teams)
    # ========================================================================

    op.create_table(
        'team',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('owner_user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    print("✅ Created team")

    # ========================================================================
    # TEAM_MEMBER (Team Membership)
    # ========================================================================

    op.create_table(
        'team_member',
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('team.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('team_id', 'user_id', name='pk_team_member'),
        sa.CheckConstraint("role IN ('member', 'admin')", name='chk_team_role_valid')
    )

    print("✅ Created team_member")

    # ========================================================================
    # CHALLENGE (Distance/Points/Streak/Volume Challenges)
    # ========================================================================

    op.create_table(
        'challenge',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('type', postgresql.ENUM('distance', 'points', 'streak', 'volume', name='challenge_type'), nullable=False),
        sa.Column('target_value', sa.Numeric(precision=14, scale=4), nullable=False),
        sa.Column('start_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('end_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('team.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('end_at > start_at', name='chk_challenge_time_valid'),
        sa.CheckConstraint('target_value > 0', name='chk_challenge_target_positive')
    )

    print("✅ Created challenge")

    # ========================================================================
    # CHALLENGE_PARTICIPANT (Challenge Progress)
    # ========================================================================

    op.create_table(
        'challenge_participant',
        sa.Column('challenge_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('challenge.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('progress_value', sa.Numeric(precision=14, scale=4), nullable=False, server_default='0'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('challenge_id', 'user_id', name='pk_challenge_participant')
    )

    print("✅ Created challenge_participant")

    # ========================================================================
    # LEADERBOARD_ENTRY (Cached Rankings)
    # ========================================================================

    op.create_table(
        'leaderboard_entry',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('scope', postgresql.ENUM('all_time', 'weekly', 'monthly', 'friends', name='leaderboard_scope'), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=True),
        sa.Column('period_end', sa.Date(), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=False),
        sa.Column('points', sa.BigInteger(), nullable=False),
        sa.Column('generated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('scope', 'period_start', 'period_end', 'user_id', name='uq_leaderboard_scope_period_user')
    )

    print("✅ Created leaderboard_entry")

    # ========================================================================
    # CREATE INDEXES
    # ========================================================================

    print("Creating indexes for social and leaderboard tables...")

    # social_friend indexes
    op.create_index('idx_social_friend_user_status', 'social_friend', ['user_id', 'status'])
    op.create_index('idx_social_friend_created', 'social_friend', ['created_at'], postgresql_ops={'created_at': 'DESC'})

    # team indexes
    op.create_index('idx_team_owner', 'team', ['owner_user_id'])
    op.create_index('idx_team_created', 'team', ['created_at'], postgresql_ops={'created_at': 'DESC'})

    # team_member indexes
    op.create_index('idx_team_member_user', 'team_member', ['user_id'])
    op.create_index('idx_team_member_joined', 'team_member', ['team_id', 'joined_at'], postgresql_ops={'joined_at': 'DESC'})

    # challenge indexes
    op.create_index('idx_challenge_period', 'challenge', ['start_at', 'end_at'])
    op.create_index('idx_challenge_type_period', 'challenge', ['type', 'start_at', 'end_at'])
    op.create_index('idx_challenge_team', 'challenge', ['team_id'])
    op.create_index('idx_challenge_public', 'challenge', ['is_public', 'start_at'], postgresql_ops={'start_at': 'DESC'})

    # challenge_participant indexes
    op.create_index('idx_participant_user', 'challenge_participant', ['user_id'])
    op.create_index('idx_participant_completed', 'challenge_participant', ['challenge_id', 'completed_at'], postgresql_ops={'completed_at': 'DESC NULLS LAST'})

    # leaderboard_entry indexes (critical for performance)
    op.create_index('idx_leaderboard_scope_rank', 'leaderboard_entry', ['scope', 'period_start', 'period_end', 'rank'])
    op.create_index('idx_leaderboard_scope_points', 'leaderboard_entry', ['scope', 'period_start', 'period_end', 'points'], postgresql_ops={'points': 'DESC'})
    op.create_index('idx_leaderboard_user', 'leaderboard_entry', ['user_id', 'scope'])
    op.create_index('idx_leaderboard_generated', 'leaderboard_entry', ['generated_at'], postgresql_ops={'generated_at': 'DESC'})

    print("✅ Created 14 indexes for social and leaderboard tables")

    print("\n" + "="*60)
    print("✅ MIGRATION 006 COMPLETE")
    print("="*60)
    print("Created: 6 social tables")
    print("  - social_friend (friend connections)")
    print("  - team (workout teams)")
    print("  - team_member (team membership)")
    print("  - challenge (distance/points/streak/volume challenges)")
    print("  - challenge_participant (challenge progress)")
    print("  - leaderboard_entry (cached rankings)")
    print("Created: 14 indexes")
    print("\n🎉 ALL SCHEMA MIGRATIONS COMPLETE!")
    print("Total: 15 tables, 4 enums, 36 indexes")
    print("="*60)


def downgrade() -> None:
    """
    Rollback: Drop social and leaderboard tables
    """

    print("Rolling back social and leaderboard tables...")

    # Drop indexes
    op.drop_index('idx_leaderboard_generated', 'leaderboard_entry')
    op.drop_index('idx_leaderboard_user', 'leaderboard_entry')
    op.drop_index('idx_leaderboard_scope_points', 'leaderboard_entry')
    op.drop_index('idx_leaderboard_scope_rank', 'leaderboard_entry')
    op.drop_index('idx_participant_completed', 'challenge_participant')
    op.drop_index('idx_participant_user', 'challenge_participant')
    op.drop_index('idx_challenge_public', 'challenge')
    op.drop_index('idx_challenge_team', 'challenge')
    op.drop_index('idx_challenge_type_period', 'challenge')
    op.drop_index('idx_challenge_period', 'challenge')
    op.drop_index('idx_team_member_joined', 'team_member')
    op.drop_index('idx_team_member_user', 'team_member')
    op.drop_index('idx_team_created', 'team')
    op.drop_index('idx_team_owner', 'team')
    op.drop_index('idx_social_friend_created', 'social_friend')
    op.drop_index('idx_social_friend_user_status', 'social_friend')

    # Drop tables (reverse order due to foreign keys)
    op.drop_table('leaderboard_entry')
    op.drop_table('challenge_participant')
    op.drop_table('challenge')
    op.drop_table('team_member')
    op.drop_table('team')
    op.drop_table('social_friend')

    print("✅ Rollback complete - social and leaderboard tables dropped")
