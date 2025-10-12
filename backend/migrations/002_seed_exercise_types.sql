-- ========================================================================
-- Seed Exercise Types (13 Exercises)
-- ========================================================================
-- Date: 2025-10-12
-- Purpose: Seed 13 exercise types with Hebrew/English names
-- Categories: Strength (6), Cardio (4), Core (3)
-- ========================================================================

BEGIN;

\echo 'Seeding exercise types...'

-- ========================================================================
-- STRENGTH EXERCISES (6)
-- ========================================================================

INSERT INTO exercise_type (key, category) VALUES
('squat', 'strength'),
('push_up', 'strength'),
('pull_up', 'strength'),
('deadlift', 'strength'),
('bench_press', 'strength'),
('rope_climb', 'strength')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- CARDIO EXERCISES (4)
-- ========================================================================

INSERT INTO exercise_type (key, category) VALUES
('burpee', 'cardio'),
('running', 'cardio'),
('walking', 'cardio'),
('cycling', 'cardio')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- CORE EXERCISES (3)
-- ========================================================================

INSERT INTO exercise_type (key, category) VALUES
('plank', 'core'),
('sit_up', 'core'),
('abs', 'core')
ON CONFLICT (key) DO NOTHING;

COMMIT;

\echo ''
\echo '=========================================================================='
\echo '✅ EXERCISE TYPES SEEDED'
\echo '=========================================================================='
\echo 'Seeded: 13 exercise types'
\echo '  Strength (6): squat, push_up, pull_up, deadlift, bench_press, rope_climb'
\echo '  Cardio (4): burpee, running, walking, cycling'
\echo '  Core (3): plank, sit_up, abs'
\echo ''
\echo 'Next: Seed 40 achievement definitions'
\echo '=========================================================================='
