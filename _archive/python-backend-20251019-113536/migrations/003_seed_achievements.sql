-- ========================================================================
-- Seed Achievement Definitions (40 Achievements)
-- ========================================================================
-- Date: 2025-10-12
-- Purpose: Seed 40 achievements with declarative JSON conditions
-- Categories: Milestone (5), Skill (7), Social (5), Streak (5), Variety (3), Special (15)
-- ========================================================================

BEGIN;

\echo 'Seeding achievement definitions...'

-- ========================================================================
-- MILESTONE ACHIEVEMENTS - Points Earned (5)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('points_1k', 'Point Starter', 'מתחיל נקודות', 'Earn 1,000 lifetime points', 'צבור 1,000 נקודות בסך הכל', 'milestone', 1, 50, '⭐', '{"type":"sum","metric":"lifetime_points","target":1000}'),
('points_5k', 'Point Earner', 'צובר נקודות', 'Earn 5,000 lifetime points', 'צבור 5,000 נקודות בסך הכל', 'milestone', 2, 75, '⭐', '{"type":"sum","metric":"lifetime_points","target":5000}'),
('points_10k', 'Point Master', 'אמן נקודות', 'Earn 10,000 lifetime points', 'צבור 10,000 נקודות בסך הכל', 'milestone', 3, 100, '⭐', '{"type":"sum","metric":"lifetime_points","target":10000}'),
('points_25k', 'Point Champion', 'אלוף נקודות', 'Earn 25,000 lifetime points', 'צבור 25,000 נקודות בסך הכל', 'milestone', 4, 125, '⭐', '{"type":"sum","metric":"lifetime_points","target":25000}'),
('points_50k', 'Point Legend', 'אגדת נקודות', 'Earn 50,000 lifetime points', 'צבור 50,000 נקודות בסך הכל', 'milestone', 5, 150, '⭐', '{"type":"sum","metric":"lifetime_points","target":50000}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- RUNNING DISTANCE ACHIEVEMENTS (5)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('run_50k', 'First 50K', '50 קילומטר ראשונים', 'Run 50 km total', 'רוץ 50 ק"מ בסך הכל', 'milestone', 1, 50, '🏃', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["running"]},"target":50.0}'),
('run_100k', 'Century Runner', 'רץ מאה', 'Run 100 km total', 'רוץ 100 ק"מ בסך הכל', 'milestone', 2, 75, '🏃', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["running"]},"target":100.0}'),
('run_250k', 'Marathon Veteran', 'ותיק מרתון', 'Run 250 km total', 'רוץ 250 ק"מ בסך הכל', 'milestone', 3, 100, '🏃', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["running"]},"target":250.0}'),
('run_500k', 'Ultra Runner', 'רץ אולטרה', 'Run 500 km total', 'רוץ 500 ק"מ בסך הכל', 'milestone', 4, 125, '🏃', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["running"]},"target":500.0}'),
('run_1000k', 'Endurance Elite', 'עילית סיבולת', 'Run 1000 km total', 'רוץ 1000 ק"מ בסך הכל', 'milestone', 5, 150, '🏃', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["running"]},"target":1000.0}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- CYCLING DISTANCE ACHIEVEMENTS (3)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('ride_200k', 'Cycling Beginner', 'רוכב מתחיל', 'Cycle 200 km total', 'רכב 200 ק"מ בסך הכל', 'milestone', 1, 50, '🚴', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["cycling"]},"target":200.0}'),
('ride_500k', 'Cyclist', 'רוכב', 'Cycle 500 km total', 'רכב 500 ק"מ בסך הכל', 'milestone', 2, 75, '🚴', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["cycling"]},"target":500.0}'),
('ride_1000k', 'Cycling Champion', 'אלוף אופניים', 'Cycle 1000 km total', 'רכב 1000 ק"מ בסך הכל', 'milestone', 3, 100, '🚴', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["cycling"]},"target":1000.0}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- WALKING ACHIEVEMENTS (2)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('walk_50k', 'Walker', 'הולך', 'Walk 50 km total', 'הלך 50 ק"מ בסך הכל', 'milestone', 1, 30, '🚶', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["walking"]},"target":50.0}'),
('walk_200k', 'Super Walker', 'הולך-על', 'Walk 200 km total', 'הלך 200 ק"מ בסך הכל', 'milestone', 2, 60, '🚶', '{"type":"sum","metric":"distance_km","filters":{"exercise_key":["walking"]},"target":200.0}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- STRENGTH VOLUME ACHIEVEMENTS (4)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('strength_50k_kg', 'Strength Starter', 'מתחיל כוח', 'Lift 50,000 kg total volume', 'הרם 50,000 ק"ג נפח כולל', 'milestone', 1, 50, '💪', '{"type":"sum","metric":"strength_volume_kg","target":50000.0}'),
('strength_200k_kg', 'Strength Builder', 'בונה כוח', 'Lift 200,000 kg total volume', 'הרם 200,000 ק"ג נפח כולל', 'milestone', 2, 75, '💪', '{"type":"sum","metric":"strength_volume_kg","target":200000.0}'),
('strength_500k_kg', 'Strength Master', 'אמן כוח', 'Lift 500,000 kg total volume', 'הרם 500,000 ק"ג נפח כולל', 'milestone', 3, 100, '💪', '{"type":"sum","metric":"strength_volume_kg","target":500000.0}'),
('strength_1m_kg', 'Strength Legend', 'אגדת כוח', 'Lift 1,000,000 kg total volume', 'הרם 1,000,000 ק"ג נפח כולל', 'milestone', 4, 125, '💪', '{"type":"sum","metric":"strength_volume_kg","target":1000000.0}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- CORE ACHIEVEMENTS (2)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('plank_2min_once', 'Plank Pro', 'מקצוען פלאנק', 'Hold plank for 2 minutes', 'החזק פלאנק 2 דקות', 'skill', 1, 40, '🔥', '{"type":"max","metric":"duration_sec","filters":{"exercise_key":["plank"]},"target":120}'),
('plank_5min_once', 'Plank Master', 'אמן פלאנק', 'Hold plank for 5 minutes', 'החזק פלאנק 5 דקות', 'skill', 2, 80, '🔥', '{"type":"max","metric":"duration_sec","filters":{"exercise_key":["plank"]},"target":300}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('core_5k_reps', 'Core Champion', 'אלוף ליבה', 'Complete 5,000 core reps', 'השלם 5,000 חזרות ליבה', 'milestone', 1, 75, '🎯', '{"type":"sum","metric":"core_reps","target":5000}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- STREAK ACHIEVEMENTS (5)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('streak_3d', 'Consistency Start', 'התחלת עקביות', 'Maintain a 3-day streak', 'שמור על רצף של 3 ימים', 'streak', 1, 20, '🔥', '{"type":"streak","metric":"days_active","target":3}'),
('streak_7d', 'Week Warrior', 'לוחם שבוע', 'Maintain a 7-day streak', 'שמור על רצף של 7 ימים', 'streak', 2, 30, '🔥', '{"type":"streak","metric":"days_active","target":7}'),
('streak_14d', 'Fortnight Fighter', 'לוחם שבועיים', 'Maintain a 14-day streak', 'שמור על רצף של 14 ימים', 'streak', 3, 50, '🔥', '{"type":"streak","metric":"days_active","target":14}'),
('streak_30d', 'Monthly Master', 'אמן חודשי', 'Maintain a 30-day streak', 'שמור על רצף של 30 ימים', 'streak', 4, 80, '🔥', '{"type":"streak","metric":"days_active","target":30}'),
('streak_100d', 'Hundred Day Hero', 'גיבור מאה ימים', 'Maintain a 100-day streak', 'שמור על רצף של 100 ימים', 'streak', 5, 200, '🔥', '{"type":"streak","metric":"days_active","target":100}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- SKILL/PR ACHIEVEMENTS (5)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('5k_sub_30', 'Speedy 5K', '5 ק"מ מהיר', 'Run 5K under 30 minutes', 'רוץ 5 ק"מ מתחת ל-30 דקות', 'skill', 1, 60, '⚡', '{"type":"distance_once","metric":"time_for_5k_sec","filters":{"exercise_key":["running"],"distance_km":5.0},"target_lt":1800}'),
('5k_sub_25', 'Fast 5K', '5 ק"מ מהיר', 'Run 5K under 25 minutes', 'רוץ 5 ק"מ מתחת ל-25 דקות', 'skill', 2, 80, '⚡', '{"type":"distance_once","metric":"time_for_5k_sec","filters":{"exercise_key":["running"],"distance_km":5.0},"target_lt":1500}'),
('squat_1rm_100kg', 'Century Squatter', 'סקוואט מאה', 'Squat 100kg estimated 1RM', 'סקוואט 100 ק"ג הערכת 1RM', 'skill', 1, 80, '🏋️', '{"type":"max","metric":"estimated_1rm_kg","filters":{"exercise_key":["squat"]},"target":100.0}'),
('bench_1rm_80kg', 'Bench Beast', 'חיית ספסל', 'Bench press 80kg estimated 1RM', 'דחיפות ספסל 80 ק"ג הערכת 1RM', 'skill', 1, 60, '🏋️', '{"type":"max","metric":"estimated_1rm_kg","filters":{"exercise_key":["bench_press"]},"target":80.0}'),
('deadlift_1rm_140kg', 'Deadlift Demon', 'שד דדליפט', 'Deadlift 140kg estimated 1RM', 'דדליפט 140 ק"ג הערכת 1RM', 'skill', 1, 100, '🏋️', '{"type":"max","metric":"estimated_1rm_kg","filters":{"exercise_key":["deadlift"]},"target":140.0}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- SOCIAL ACHIEVEMENTS (5)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('first_friend', 'Social Starter', 'מתחיל חברתי', 'Add your first friend', 'הוסף חבר ראשון', 'social', 1, 10, '👥', '{"type":"count","metric":"friends","target":1}'),
('team_player', 'Team Member', 'חבר צוות', 'Join a team', 'הצטרף לצוות', 'social', 1, 20, '🤝', '{"type":"count","metric":"teams_joined","target":1}'),
('high_five', 'Team Spirit', 'רוח צוות', 'Complete 5 team sessions', 'השלם 5 אימוני צוות', 'social', 1, 40, '🙌', '{"type":"count","metric":"team_sessions","target":5}'),
('challenger', 'Challenge Accepted', 'אתגר התקבל', 'Complete 1 challenge', 'השלם אתגר אחד', 'social', 1, 30, '🎯', '{"type":"count","metric":"challenges_completed","target":1}'),
('challenger_5', 'Challenge Master', 'אמן אתגרים', 'Complete 5 challenges', 'השלם 5 אתגרים', 'social', 2, 80, '🎯', '{"type":"count","metric":"challenges_completed","target":5}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- VARIETY/CONSISTENCY ACHIEVEMENTS (3)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('triple_play_week', 'Tri-Athlete', 'טריאתלט', 'Log strength + cardio + core in one week', 'רשום כוח + קרדיו + ליבה בשבוע אחד', 'milestone', 1, 50, '🔀', '{"type":"variety","metric":"categories_per_week","target":3}'),
('weekly_warrior_4', 'Monthly Warrior', 'לוחם חודשי', 'Hit weekly goal 4 weeks in a row', 'הגע ליעד שבועי 4 שבועות ברצף', 'streak', 1, 100, '📅', '{"type":"count","metric":"weekly_goals_streak","target":4}'),
('variety_lover', 'Exercise Explorer', 'חוקר תרגילים', 'Log 10 different exercise types', 'רשום 10 סוגי תרגילים שונים', 'milestone', 1, 60, '🎪', '{"type":"count_distinct","metric":"exercise_types_logged","target":10}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- SEASONAL/TIME-BASED ACHIEVEMENTS (2)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('early_bird', 'Morning Warrior', 'לוחם בוקר', 'Work out before 7 AM', 'התאמן לפני 7 בבוקר', 'seasonal', 1, 15, '🌅', '{"type":"count","metric":"workouts_before_7am","target":1}'),
('night_owl', 'Night Fighter', 'לוחם לילה', 'Work out after 10 PM', 'התאמן אחרי 10 בערב', 'seasonal', 1, 15, '🦉', '{"type":"count","metric":"workouts_after_10pm","target":1}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- BEGINNER QUICK WINS (4)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('first_workout', 'First Steps', 'צעדים ראשונים', 'Complete your first workout', 'השלם את האימון הראשון שלך', 'milestone', 1, 25, '🏁', '{"type":"count","metric":"total_workouts","target":1}'),
('workout_week_1', 'Week One', 'שבוע אחד', 'Work out 3 times in your first week', 'התאמן 3 פעמים בשבוע הראשון', 'milestone', 1, 40, '📅', '{"type":"count","metric":"workouts_first_week","target":3}'),
('first_pr', 'Personal Best', 'הישג אישי', 'Set your first personal record', 'קבע שיא אישי ראשון', 'skill', 1, 30, '📈', '{"type":"count","metric":"personal_records","target":1}'),
('variety_starter', 'Exercise Sampler', 'דוגם תרגילים', 'Try 3 different exercise types', 'נסה 3 סוגי תרגילים שונים', 'milestone', 1, 20, '🎨', '{"type":"count_distinct","metric":"exercise_types_logged","target":3}')
ON CONFLICT (key) DO NOTHING;

-- ========================================================================
-- WORKOUT COUNT MILESTONES (4)
-- ========================================================================

INSERT INTO achievement_definition (key, name_en, name_he, description_en, description_he, category, tier, points_reward, icon_key, condition_json) VALUES
('workout_10', 'Dedicated Ten', 'עשר מסורים', 'Complete 10 workouts', 'השלם 10 אימונים', 'milestone', 1, 50, '🎯', '{"type":"count","metric":"total_workouts","target":10}'),
('workout_50', 'Half Century', 'חצי מאה', 'Complete 50 workouts', 'השלם 50 אימונים', 'milestone', 2, 100, '🎯', '{"type":"count","metric":"total_workouts","target":50}'),
('workout_100', 'Workout Champion', 'אלוף אימונים', 'Complete 100 workouts', 'השלם 100 אימונים', 'milestone', 3, 150, '🎯', '{"type":"count","metric":"total_workouts","target":100}'),
('workout_250', 'Workout Legend', 'אגדת אימונים', 'Complete 250 workouts', 'השלם 250 אימונים', 'milestone', 4, 200, '🎯', '{"type":"count","metric":"total_workouts","target":250}')
ON CONFLICT (key) DO NOTHING;

COMMIT;

\echo ''
\echo '=========================================================================='
\echo '✅ ACHIEVEMENT DEFINITIONS SEEDED'
\echo '=========================================================================='
\echo 'Seeded: 40 achievements'
\echo '  Milestone (18): Points, distance, volume, workouts, variety'
\echo '  Skill (7): PR-based and performance targets'
\echo '  Social (5): Friends, teams, challenges'
\echo '  Streak (6): 3, 7, 14, 30, 100 days + weekly consistency'
\echo '  Seasonal (4): Time-based and quick wins'
\echo ''
\echo 'All achievements use declarative JSON conditions (NO eval!)'
\echo 'Next: Build calculation engine with transparent formulas'
\echo '=========================================================================='
