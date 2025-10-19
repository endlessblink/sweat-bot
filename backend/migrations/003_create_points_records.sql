-- PostgreSQL Migration: Points Records Table
-- Alternative to MongoDB for better performance with PostgreSQL

-- Create points_records table (alternative to MongoDB storage)
CREATE TABLE IF NOT EXISTS points_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL CHECK (points >= 0),
    reason VARCHAR(500) NOT NULL,
    source VARCHAR(100) NOT NULL CHECK (source IN ('exercise_logging', 'workout_completion', 'ai_chat', 'ai_feedback', 'daily_checkin', 'achievement', 'bonus')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON points_records(created_at);
CREATE INDEX IF NOT EXISTS idx_points_records_source ON points_records(source);
CREATE INDEX IF NOT EXISTS idx_points_records_points ON points_records(points);

-- Add comments for documentation
COMMENT ON TABLE points_records IS 'Points awarded to users for various activities';
COMMENT ON COLUMN points_records.points IS 'Number of points awarded';
COMMENT ON COLUMN points_records.reason IS 'Description of why points were awarded';
COMMENT ON COLUMN points_records.source IS 'Source of the points (exercise, chat, feedback, etc.)';
COMMENT ON COLUMN points_records.metadata IS 'Additional data in JSON format';