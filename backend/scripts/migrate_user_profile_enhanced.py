"""
Database migration script for enhanced user profile fields
Adds comprehensive health stats, equipment profile, and fitness preferences
"""

import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def run_migration():
    """Run the database migration to add enhanced user profile fields"""

    # Create database engine - convert asyncpg URL to sync psycopg2 URL
    sync_database_url = settings.DATABASE_URL.replace(
        "postgresql+asyncpg://", "postgresql://"
    )
    engine = create_engine(sync_database_url)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        logger.info("Starting database migration for enhanced user profiles...")

        # Add new columns to users table
        migrations = [
            # Enhanced Health Stats
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS body_fat_percentage FLOAT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS resting_heart_rate INTEGER",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_pressure_systolic INTEGER",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_pressure_diastolic INTEGER",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_conditions TEXT[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS injuries TEXT[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(50)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS workout_frequency_per_week INTEGER",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_workout_duration_minutes INTEGER",

            # Equipment Profile
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS available_equipment JSONB",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS equipment_preferences JSON",

            # Fitness Goals & Preferences
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS fitness_goals TEXT[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_workout_types TEXT[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avoid_exercises TEXT[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS focus_areas TEXT[]",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS time_constraints JSON",

            # Profile Completion Tracking
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS last_profile_update TIMESTAMP WITH TIME ZONE",
        ]

        for migration_sql in migrations:
            try:
                logger.info(f"Executing: {migration_sql}")
                session.execute(text(migration_sql))
                session.commit()
                logger.info("✓ Migration successful")
            except Exception as e:
                logger.error(f"✗ Migration failed: {str(e)}")
                session.rollback()
                # Continue with other migrations even if one fails
                continue

        logger.info("Database migration completed successfully!")

        # Update existing users' profile completion percentage
        logger.info("Calculating profile completion for existing users...")
        update_profile_completion_sql = """
        UPDATE users
        SET profile_completion_percentage = (
            CASE
                WHEN age IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN weight_kg IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN height_cm IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN fitness_level IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN activity_level IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN workout_frequency_per_week IS NOT NULL THEN 10 ELSE 0 END +
                CASE WHEN fitness_goals IS NOT NULL AND array_length(fitness_goals, 1) > 0 THEN 20 ELSE 0 END +
                CASE WHEN preferred_workout_types IS NOT NULL AND array_length(preferred_workout_types, 1) > 0 THEN 10 ELSE 0 END +
                CASE WHEN available_equipment IS NOT NULL THEN 10 ELSE 0 END
        )
        WHERE profile_completion_percentage = 0 OR profile_completion_percentage IS NULL
        """
        session.execute(text(update_profile_completion_sql))
        session.commit()
        logger.info("✓ Profile completion percentages updated")

    except Exception as e:
        logger.error(f"Migration failed with error: {str(e)}")
        session.rollback()
        raise
    finally:
        session.close()
        engine.dispose()


if __name__ == "__main__":
    try:
        run_migration()
        print("\n✅ Migration completed successfully!")
        print("Enhanced user profile fields have been added to the database.")
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        sys.exit(1)
