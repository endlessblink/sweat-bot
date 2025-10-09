"""
Database setup script for points system
Creates the new tables and migrates existing data
"""

import asyncio
import sys
import os
import json
import logging

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.models.models import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_points_system_tables():
    """Create the new points system tables"""
    
    # Create async engine
    engine = create_async_engine(settings.DATABASE_URL)
    
    try:
        # Create all tables
        async with engine.begin() as conn:
            # Create the new points system tables
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS points_configurations (
                    id SERIAL PRIMARY KEY,
                    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('exercise', 'achievement', 'rule')),
                    entity_key VARCHAR(100) NOT NULL,
                    config_data JSONB NOT NULL,
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE,
                    version INTEGER DEFAULT 1
                );
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_points_config_entity 
                ON points_configurations(entity_type, entity_key, is_active);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_points_config_active 
                ON points_configurations(is_active);
            """))
            
            await conn.execute(text("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_points_config_unique 
                ON points_configurations(entity_type, entity_key, version);
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS points_history (
                    id SERIAL PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id),
                    exercise_id UUID REFERENCES exercises(id),
                    points_earned INTEGER NOT NULL,
                    calculation_breakdown JSONB,
                    rule_ids TEXT[],
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_points_history_user 
                ON points_history(user_id);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_points_history_date 
                ON points_history(created_at);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_points_history_points 
                ON points_history(points_earned);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_points_history_user_date 
                ON points_history(user_id, created_at);
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_achievements (
                    id SERIAL PRIMARY KEY,
                    user_id UUID NOT NULL REFERENCES users(id),
                    achievement_type VARCHAR(50) NOT NULL,
                    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    points_awarded INTEGER,
                    notified BOOLEAN DEFAULT false,
                    metadata JSONB
                );
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
                ON user_achievements(user_id);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_achievements_date 
                ON user_achievements(earned_at);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_achievements_user_type 
                ON user_achievements(user_id, achievement_type);
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS leaderboards (
                    id SERIAL PRIMARY KEY,
                    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'all_time')),
                    period_start DATE NOT NULL,
                    period_end DATE NOT NULL,
                    cache_data JSONB NOT NULL,
                    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_leaderboards_period 
                ON leaderboards(period_type, period_start);
            """))
            
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_leaderboards_updated 
                ON leaderboards(last_updated);
            """))
            
            logger.info("✅ Points system tables created successfully")
            
            # Migrate existing exercise configurations
            await migrate_existing_configurations(conn)
            
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        raise
    finally:
        await engine.dispose()

async def migrate_existing_configurations(conn):
    """Migrate existing JSON configurations to database"""
    
    # Check if data/points_config directory exists and migrate files
    import os
    import json
    
    points_config_dir = "data/points_config"
    
    if os.path.exists(points_config_dir):
        logger.info("🔄 Migrating existing configurations...")
        
        # Migrate exercise points
        exercise_file = os.path.join(points_config_dir, "exercise_points.json")
        if os.path.exists(exercise_file):
            try:
                with open(exercise_file, 'r', encoding='utf-8') as f:
                    exercises = json.load(f)
                
                for exercise_key, config in exercises.items():
                    await conn.execute(text("""
                        INSERT INTO points_configurations 
                        (entity_type, entity_key, config_data, is_active, version)
                        VALUES ('exercise', :key, :config, true, 1)
                        ON CONFLICT (entity_type, entity_key, version) DO NOTHING
                    """), {
                        'key': exercise_key,
                        'config': json.dumps(config)
                    })
                
                logger.info(f"✅ Migrated {len(exercises)} exercise configurations")
            except Exception as e:
                logger.error(f"Failed to migrate exercises: {e}")
        
        # Migrate achievements
        achievements_file = os.path.join(points_config_dir, "achievements.json")
        if os.path.exists(achievements_file):
            try:
                with open(achievements_file, 'r', encoding='utf-8') as f:
                    achievements = json.load(f)
                
                for achievement_key, config in achievements.items():
                    await conn.execute(text("""
                        INSERT INTO points_configurations 
                        (entity_type, entity_key, config_data, is_active, version)
                        VALUES ('achievement', :key, :config, true, 1)
                        ON CONFLICT (entity_type, entity_key, version) DO NOTHING
                    """), {
                        'key': achievement_key,
                        'config': json.dumps(config)
                    })
                
                logger.info(f"✅ Migrated {len(achievements)} achievement configurations")
            except Exception as e:
                logger.error(f"Failed to migrate achievements: {e}")
        
        # Migrate rules
        rules_file = os.path.join(points_config_dir, "rules.json")
        if os.path.exists(rules_file):
            try:
                with open(rules_file, 'r', encoding='utf-8') as f:
                    rules = json.load(f)
                
                for rule_key, config in rules.items():
                    await conn.execute(text("""
                        INSERT INTO points_configurations 
                        (entity_type, entity_key, config_data, is_active, version)
                        VALUES ('rule', :key, :config, true, 1)
                        ON CONFLICT (entity_type, entity_key, version) DO NOTHING
                    """), {
                        'key': rule_key,
                        'config': json.dumps(config)
                    })
                
                logger.info(f"✅ Migrated {len(rules)} rule configurations")
            except Exception as e:
                logger.error(f"Failed to migrate rules: {e}")
        
        # Create default configurations if no existing files
        await create_default_configurations(conn)
    
    else:
        logger.info("📝 No existing configurations found, creating defaults...")
        await create_default_configurations(conn)

async def create_default_configurations(conn):
    """Create default configurations for the points system"""
    
    # Default exercise configurations
    default_exercises = {
        "squat": {
            "exercise_key": "squat",
            "name": "Squat",
            "name_he": "סקוואט",
            "category": "strength",
            "points_base": 10,
            "multipliers": {
                "reps": 1.0,
                "sets": 5.0,
                "weight": 0.1
            },
            "enabled": True
        },
        "push_up": {
            "exercise_key": "push_up",
            "name": "Push-up",
            "name_he": "שכיבות סמיכה",
            "category": "strength",
            "points_base": 8,
            "multipliers": {
                "reps": 1.0,
                "sets": 3.0,
                "weight": 0.05
            },
            "enabled": True
        },
        "deadlift": {
            "exercise_key": "deadlift",
            "name": "Deadlift",
            "name_he": "דדליפט",
            "category": "strength",
            "points_base": 20,
            "multipliers": {
                "reps": 1.5,
                "sets": 8.0,
                "weight": 0.2
            },
            "enabled": True
        },
        "burpee": {
            "exercise_key": "burpee",
            "name": "Burpee",
            "name_he": "ברפי",
            "category": "cardio",
            "points_base": 15,
            "multipliers": {
                "reps": 2.0,
                "sets": 5.0,
                "weight": 0.0
            },
            "enabled": True
        },
        "plank": {
            "exercise_key": "plank",
            "name": "Plank",
            "name_he": "פלאנק",
            "category": "core",
            "points_base": 8,
            "multipliers": {
                "reps": 0.5,
                "sets": 2.0,
                "weight": 0.0
            },
            "enabled": True
        }
    }
    
    # Default rules
    default_rules = {
        "weight_bonus": {
            "id": "weight_bonus",
            "name": "Weight Bonus",
            "name_he": "בונוס משקל",
            "description": "Bonus points for weighted exercises",
            "description_he": "בונוס נקודות לתרגילים עם משקולות",
            "rule_type": "bonus",
            "value": 50,
            "condition": "weight_kg > 0",
            "enabled": True
        },
        "high_rep_bonus": {
            "id": "high_rep_bonus",
            "name": "High Rep Bonus",
            "name_he": "בונוס חזרות גבוהות",
            "description": "Bonus for exercises with 20+ reps",
            "description_he": "בונוס לתרגילים עם 20+ חזרות",
            "rule_type": "bonus",
            "value": 50,
            "condition": "reps >= 20",
            "enabled": True
        },
        "personal_record": {
            "id": "personal_record",
            "name": "Personal Record",
            "name_he": "שיא אישי",
            "description": "Bonus for setting new personal records",
            "description_he": "בונוס על קביעת שיא אישי חדש",
            "rule_type": "bonus",
            "value": 50,
            "condition": "is_personal_record = true",
            "enabled": True
        }
    }
    
    try:
        # Insert default exercises
        for exercise_key, config in default_exercises.items():
            await conn.execute(text("""
                INSERT INTO points_configurations 
                (entity_type, entity_key, config_data, is_active, version)
                VALUES ('exercise', :key, :config, true, 1)
                ON CONFLICT (entity_type, entity_key, version) DO NOTHING
            """), {
                'key': exercise_key,
                'config': json.dumps(config)
            })
        
        # Insert default rules
        for rule_key, config in default_rules.items():
            await conn.execute(text("""
                INSERT INTO points_configurations 
                (entity_type, entity_key, config_data, is_active, version)
                VALUES ('rule', :key, :config, true, 1)
                ON CONFLICT (entity_type, entity_key, version) DO NOTHING
            """), {
                'key': rule_key,
                'config': json.dumps(config)
            })
        
        logger.info("✅ Default configurations created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create default configurations: {e}")

async def main():
    """Main function to run the migration"""
    logger.info("🚀 Starting points system database setup...")
    
    try:
        await create_points_system_tables()
        logger.info("🎉 Points system setup completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Setup failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())