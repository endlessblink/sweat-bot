-- PostgreSQL Migration: Exercise Logs Table
-- Matches the Python FastAPI exercise schema exactly

-- Create exercise_logs table
CREATE TABLE IF NOT EXISTS exercise_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    sets INTEGER NOT NULL CHECK (sets > 0),
    reps INTEGER NOT NULL CHECK (reps > 0),
    weight DECIMAL(5,2) CHECK (weight >= 0),
    notes TEXT,
    workout_type VARCHAR(50) DEFAULT 'strength' CHECK (workout_type IN ('strength', 'cardio', 'flexibility', 'sports')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_id ON exercise_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_created_at ON exercise_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_type ON exercise_logs(workout_type);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_name ON exercise_logs(exercise_name);

-- Add comments for documentation
COMMENT ON TABLE exercise_logs IS 'Individual exercise logs for user workouts';
COMMENT ON COLUMN exercise_logs.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN exercise_logs.exercise_name IS 'Name of the exercise performed';
COMMENT ON COLUMN exercise_logs.sets IS 'Number of sets completed';
COMMENT ON COLUMN exercise_logs.reps IS 'Number of repetitions per set';
COMMENT ON COLUMN exercise_logs.weight IS 'Weight used (in kg/lbs)';
COMMENT ON COLUMN exercise_logs.notes IS 'Optional notes about the exercise';
COMMENT ON COLUMN exercise_logs.workout_type IS 'Type of workout: strength, cardio, flexibility, or sports';