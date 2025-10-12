-- ========================================================================
-- Points System v4.0 - Complete Schema Migration
-- ========================================================================
-- Date: 2025-10-12
-- Purpose: Archive v3 and create fresh v4 schema (clean slate approach)
-- Tables: 18 total (4 core, 4 aggregation, 3 achievement, 6 social, 1 leaderboard)
-- ========================================================================

BEGIN;

-- ========================================================================
-- PHASE 1: ARCHIVE V3 TABLES (Safety Net)
-- ========================================================================

\echo 'Archiving v3 tables...'

ALTER TABLE IF EXISTS points_configuration_v3 RENAME TO points_configuration_v3_archive;
ALTER TABLE IF EXISTS points_calculations_v3 RENAME TO points_calculations_v3_archive;
ALTER TABLE IF EXISTS user_points_summary_v3 RENAME TO user_points_summary_v3_archive;
ALTER TABLE IF EXISTS user_achievements_v3 RENAME TO user_achievements_v3_archive;
ALTER TABLE IF EXISTS leaderboard_cache_v3 RENAME TO leaderboard_cache_v3_archive;
ALTER TABLE IF EXISTS points_config_audit_v3 RENAME TO points_config_audit_v3_archive;

\echo '✅ Archived 6 v3 tables'

-- ========================================================================
-- PHASE 2: CREATE ENUMS
-- ========================================================================

\echo 'Creating enums...'

DO $$ BEGIN
    CREATE TYPE exercise_category AS ENUM ('strength', 'cardio', 'core');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE achievement_category AS ENUM ('milestone', 'skill', 'social', 'seasonal', 'streak');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE leaderboard_scope AS ENUM ('all_time', 'weekly', 'monthly', 'friends');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_type AS ENUM ('distance', 'points', 'streak', 'volume');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

\echo '✅ Created 4 enums'

-- ========================================================================
-- PHASE 3: CORE ACTIVITY TABLES
-- ========================================================================

\echo 'Creating core activity tables...'

-- Exercise types (reference data)
CREATE TABLE IF NOT EXISTS exercise_type (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    category exercise_category NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Activity log (immutable exercise logs)
CREATE TABLE IF NOT EXISTS activity_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    exercise_type_id INTEGER NOT NULL REFERENCES exercise_type(id),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'manual',
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_activity_time_valid CHECK (ended_at > started_at),
    CONSTRAINT chk_activity_duration_reasonable CHECK (ended_at - started_at < INTERVAL '8 hours')
);

-- Strength activity details
CREATE TABLE IF NOT EXISTS activity_strength_set (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,
    set_index INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    rpe NUMERIC(3,1),
    tempo VARCHAR(20),
    CONSTRAINT chk_strength_reps_positive CHECK (reps >= 0),
    CONSTRAINT chk_strength_weight_positive CHECK (weight_kg >= 0)
);

-- Cardio activity details
CREATE TABLE IF NOT EXISTS activity_cardio (
    activity_id BIGINT PRIMARY KEY REFERENCES activity_log(id) ON DELETE CASCADE,
    distance_km NUMERIC(7,3) NOT NULL,
    duration_sec INTEGER NOT NULL,
    avg_hr INTEGER,
    elevation_gain_m INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_cardio_distance_positive CHECK (distance_km >= 0),
    CONSTRAINT chk_cardio_duration_positive CHECK (duration_sec > 0),
    CONSTRAINT chk_cardio_elevation_positive CHECK (elevation_gain_m >= 0)
);

-- Core activity details
CREATE TABLE IF NOT EXISTS activity_core (
    activity_id BIGINT PRIMARY KEY REFERENCES activity_log(id) ON DELETE CASCADE,
    reps INTEGER,
    duration_sec INTEGER,
    variant VARCHAR(100),
    CONSTRAINT chk_core_reps_positive CHECK (reps >= 0 OR reps IS NULL),
    CONSTRAINT chk_core_duration_positive CHECK (duration_sec >= 0 OR duration_sec IS NULL)
);

-- Points calculation (single source of truth)
CREATE TABLE IF NOT EXISTS points_calculation (
    id BIGSERIAL PRIMARY KEY,
    activity_id BIGINT UNIQUE NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    exercise_type_id INTEGER NOT NULL REFERENCES exercise_type(id),
    base_points INTEGER NOT NULL,
    bonus_points INTEGER NOT NULL DEFAULT 0,
    multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    total_points INTEGER GENERATED ALWAYS AS (FLOOR((base_points + bonus_points) * multiplier)) STORED,
    breakdown_json JSONB NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

\echo '✅ Created 6 core activity tables'

-- ========================================================================
-- PHASE 4: AGGREGATION TABLES
-- ========================================================================

\echo 'Creating aggregation tables...'

-- Daily stats rollups
CREATE TABLE IF NOT EXISTS user_stats_daily (
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    total_points INTEGER NOT NULL DEFAULT 0,
    total_distance_km NUMERIC(9,3) NOT NULL DEFAULT 0,
    total_duration_sec INTEGER NOT NULL DEFAULT 0,
    strength_volume_kg NUMERIC(12,2) NOT NULL DEFAULT 0,
    sets_completed INTEGER NOT NULL DEFAULT 0,
    core_reps INTEGER NOT NULL DEFAULT 0,
    core_duration_sec INTEGER NOT NULL DEFAULT 0,
    activities_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, date)
);

-- Lifetime summaries
CREATE TABLE IF NOT EXISTS user_stats_summary (
    user_id UUID PRIMARY KEY,
    lifetime_points BIGINT NOT NULL DEFAULT 0,
    lifetime_distance_km NUMERIC(12,3) NOT NULL DEFAULT 0,
    lifetime_duration_sec BIGINT NOT NULL DEFAULT 0,
    lifetime_strength_kg NUMERIC(14,2) NOT NULL DEFAULT 0,
    lifetime_core_reps BIGINT NOT NULL DEFAULT 0,
    weekly_points INTEGER NOT NULL DEFAULT 0,
    weekly_distance_km NUMERIC(12,3) NOT NULL DEFAULT 0,
    monthly_points INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Personal records
CREATE TABLE IF NOT EXISTS user_personal_record (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    exercise_type_id INTEGER NOT NULL REFERENCES exercise_type(id),
    metric_key VARCHAR(100) NOT NULL,
    metric_value NUMERIC(14,4) NOT NULL,
    achieved_at TIMESTAMPTZ NOT NULL,
    UNIQUE (user_id, exercise_type_id, metric_key)
);

-- Streaks with grace periods
CREATE TABLE IF NOT EXISTS user_streak (
    user_id UUID PRIMARY KEY,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE,
    grace_tokens INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_current_streak_positive CHECK (current_streak >= 0),
    CONSTRAINT chk_best_streak_positive CHECK (best_streak >= 0),
    CONSTRAINT chk_grace_tokens_positive CHECK (grace_tokens >= 0)
);

\echo '✅ Created 4 aggregation tables'

-- ========================================================================
-- PHASE 5: ACHIEVEMENT TABLES
-- ========================================================================

\echo 'Creating achievement tables...'

-- Achievement definitions
CREATE TABLE IF NOT EXISTS achievement_definition (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    name_en VARCHAR(200) NOT NULL,
    name_he VARCHAR(200) NOT NULL,
    description_en TEXT NOT NULL,
    description_he TEXT NOT NULL,
    category achievement_category NOT NULL,
    tier INTEGER NOT NULL DEFAULT 1,
    points_reward INTEGER NOT NULL DEFAULT 0,
    icon_key VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    condition_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_achievement_tier_positive CHECK (tier >= 1),
    CONSTRAINT chk_achievement_points_positive CHECK (points_reward >= 0)
);

-- User achievements (unlocked)
CREATE TABLE IF NOT EXISTS user_achievement (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id INTEGER NOT NULL REFERENCES achievement_definition(id),
    unlocked_at TIMESTAMPTZ NOT NULL,
    progress_value NUMERIC(14,4) NOT NULL DEFAULT 0,
    progress_target NUMERIC(14,4) NOT NULL DEFAULT 0,
    UNIQUE (user_id, achievement_id)
);

-- Achievement progress (real-time tracking)
CREATE TABLE IF NOT EXISTS user_achievement_progress (
    user_id UUID NOT NULL,
    achievement_id INTEGER NOT NULL REFERENCES achievement_definition(id),
    progress_value NUMERIC(14,4) NOT NULL DEFAULT 0,
    progress_target NUMERIC(14,4) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

\echo '✅ Created 3 achievement tables'

-- ========================================================================
-- PHASE 6: SOCIAL TABLES
-- ========================================================================

\echo 'Creating social tables...'

-- Friend connections
CREATE TABLE IF NOT EXISTS social_friend (
    user_id UUID NOT NULL,
    friend_user_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, friend_user_id),
    CONSTRAINT chk_friend_status_valid CHECK (status IN ('pending', 'accepted', 'blocked'))
);

-- Teams
CREATE TABLE IF NOT EXISTS team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    owner_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team membership
CREATE TABLE IF NOT EXISTS team_member (
    team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id),
    CONSTRAINT chk_team_role_valid CHECK (role IN ('member', 'admin'))
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type challenge_type NOT NULL,
    target_value NUMERIC(14,4) NOT NULL,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    team_id UUID REFERENCES team(id) ON DELETE SET NULL,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_challenge_time_valid CHECK (end_at > start_at),
    CONSTRAINT chk_challenge_target_positive CHECK (target_value > 0)
);

-- Challenge participants
CREATE TABLE IF NOT EXISTS challenge_participant (
    challenge_id UUID NOT NULL REFERENCES challenge(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    progress_value NUMERIC(14,4) NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (challenge_id, user_id)
);

-- Leaderboard cache
CREATE TABLE IF NOT EXISTS leaderboard_entry (
    id BIGSERIAL PRIMARY KEY,
    scope leaderboard_scope NOT NULL,
    period_start DATE,
    period_end DATE,
    user_id UUID NOT NULL,
    rank INTEGER NOT NULL,
    points BIGINT NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (scope, period_start, period_end, user_id)
);

\echo '✅ Created 6 social tables'

-- ========================================================================
-- PHASE 7: CREATE ALL INDEXES
-- ========================================================================

\echo 'Creating indexes...'

-- Core activity indexes (6 indexes)
CREATE INDEX IF NOT EXISTS idx_activity_user_exercise_time ON activity_log (user_id, exercise_type_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user_started ON activity_log (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_user_calculated_at ON points_calculation (user_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_total_points ON points_calculation (total_points DESC);
CREATE INDEX IF NOT EXISTS idx_points_activity_time ON points_calculation (user_id, exercise_type_id, calculated_at DESC);

-- Aggregation indexes (8 indexes)
CREATE INDEX IF NOT EXISTS idx_user_stats_daily_points ON user_stats_daily (user_id, total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_daily_date ON user_stats_daily (user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_summary_lifetime_points ON user_stats_summary (lifetime_points DESC);
CREATE INDEX IF NOT EXISTS idx_summary_weekly_points ON user_stats_summary (weekly_points DESC);
CREATE INDEX IF NOT EXISTS idx_pr_user_exercise ON user_personal_record (user_id, exercise_type_id);
CREATE INDEX IF NOT EXISTS idx_pr_achieved_at ON user_personal_record (achieved_at DESC);
CREATE INDEX IF NOT EXISTS idx_streak_current ON user_streak (current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_streak_best ON user_streak (best_streak DESC);

-- Achievement indexes (8 indexes)
CREATE INDEX IF NOT EXISTS idx_achievement_category ON achievement_definition (category);
CREATE INDEX IF NOT EXISTS idx_achievement_tier ON achievement_definition (category, tier);
CREATE INDEX IF NOT EXISTS idx_achievement_active ON achievement_definition (is_active);
CREATE INDEX IF NOT EXISTS idx_user_achievement_user ON user_achievement (user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievement_unlocked ON user_achievement (user_id, unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_achievement_definition ON user_achievement (achievement_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_user ON user_achievement_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_progress_updated ON user_achievement_progress (user_id, updated_at DESC);

-- Social indexes (14 indexes)
CREATE INDEX IF NOT EXISTS idx_social_friend_user_status ON social_friend (user_id, status);
CREATE INDEX IF NOT EXISTS idx_social_friend_created ON social_friend (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_owner ON team (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_created ON team (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_member_user ON team_member (user_id);
CREATE INDEX IF NOT EXISTS idx_team_member_joined ON team_member (team_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_period ON challenge (start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_challenge_type_period ON challenge (type, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_challenge_team ON challenge (team_id);
CREATE INDEX IF NOT EXISTS idx_challenge_public ON challenge (is_public, start_at DESC);
CREATE INDEX IF NOT EXISTS idx_participant_user ON challenge_participant (user_id);
CREATE INDEX IF NOT EXISTS idx_participant_completed ON challenge_participant (challenge_id, completed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scope_rank ON leaderboard_entry (scope, period_start, period_end, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scope_points ON leaderboard_entry (scope, period_start, period_end, points DESC);

\echo '✅ Created 36 indexes'

COMMIT;

-- ========================================================================
-- SUMMARY
-- ========================================================================

\echo ''
\echo '=========================================================================='
\echo '✅ POINTS SYSTEM V4.0 SCHEMA COMPLETE'
\echo '=========================================================================='
\echo 'Archived: 6 v3 tables → *_archive'
\echo 'Created: 4 enums'
\echo 'Created: 18 tables'
\echo '  Core (6): exercise_type, activity_log, activity_strength_set,'
\echo '            activity_cardio, activity_core, points_calculation'
\echo '  Aggregation (4): user_stats_daily, user_stats_summary,'
\echo '                   user_personal_record, user_streak'
\echo '  Achievements (3): achievement_definition, user_achievement,'
\echo '                    user_achievement_progress'
\echo '  Social (5): social_friend, team, team_member, challenge,'
\echo '              challenge_participant, leaderboard_entry'
\echo 'Created: 36 indexes'
\echo ''
\echo 'Next steps:'
\echo '  1. Run seed scripts for exercise types and achievements'
\echo '  2. Build calculation engine with transparent formulas'
\echo '  3. Implement API endpoints for v4'
\echo '=========================================================================='
