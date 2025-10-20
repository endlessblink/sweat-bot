-- Database migration for enhanced user profile fields
-- Adds comprehensive health stats, equipment profile, and fitness preferences

-- Enhanced Health Stats
ALTER TABLE users ADD COLUMN IF NOT EXISTS body_fat_percentage FLOAT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resting_heart_rate INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_pressure_systolic INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_pressure_diastolic INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS injuries TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_frequency_per_week INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_workout_duration_minutes INTEGER;

-- Equipment Profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS available_equipment JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipment_preferences JSONB;

-- Fitness Goals & Preferences
ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goals TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_workout_types TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS avoid_exercises TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS focus_areas TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS time_constraints JSONB;

-- Profile Completion Tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE;

-- Update existing users' profile completion percentage
UPDATE users
SET profile_completion_percentage = (
    CASE WHEN age IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN weight_kg IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN height_cm IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN fitness_level IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN activity_level IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN workout_frequency_per_week IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN fitness_goals IS NOT NULL AND array_length(fitness_goals, 1) > 0 THEN 20 ELSE 0 END +
    CASE WHEN preferred_workout_types IS NOT NULL AND array_length(preferred_workout_types, 1) > 0 THEN 10 ELSE 0 END +
    CASE WHEN available_equipment IS NOT NULL THEN 10 ELSE 0 END
)
WHERE profile_completion_percentage = 0 OR profile_completion_percentage IS NULL;
