#!/usr/bin/env python3
"""
Database initialization script for SweatBot
Creates database, tables, and initial data
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.core.config import settings
from app.core.database import engine, init_db
from app.models.models import Base, User, GamificationStats
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def create_database_if_not_exists():
    """Create database if it doesn't exist"""
    try:
        # Extract database name from URL
        db_url_parts = settings.DATABASE_URL.split('/')
        db_name = db_url_parts[-1]
        
        # Create connection to postgres database (default)
        postgres_url = '/'.join(db_url_parts[:-1]) + '/postgres'
        postgres_url = postgres_url.replace('postgresql+asyncpg://', 'postgresql+asyncpg://')
        
        # Try to connect to the target database first
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            logger.info(f"✅ Database '{db_name}' exists and is accessible")
            return True
            
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        logger.info(f"Note: You may need to create database '{db_name}' manually")
        logger.info(f"Run: createdb {db_name}")
        return False

async def create_tables():
    """Create all database tables"""
    try:
        logger.info("🔨 Creating database tables...")
        await init_db()
        logger.info("✅ Database tables created successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to create tables: {e}")
        return False

async def create_demo_user():
    """Create a demo user for testing"""
    try:
        async with AsyncSessionLocal() as session:
            # Check if demo user already exists
            result = await session.execute(
                text("SELECT id FROM users WHERE email = 'demo@sweatbot.com'")
            )
            if result.fetchone():
                logger.info("Demo user already exists")
                return True
            
            # Create demo user
            demo_user = User(
                email="demo@sweatbot.com",
                username="demo_user",
                full_name="Demo User",
                full_name_he="משתמש דמו",
                age=30,
                weight_kg=75.0,
                height_cm=175.0,
                fitness_level="intermediate",
                preferred_language="he",
                is_active=True,
                is_verified=True
            )
            
            session.add(demo_user)
            await session.flush()
            
            # Create gamification stats for demo user
            demo_stats = GamificationStats(
                user_id=demo_user.id,
                total_points=150,
                current_level=2,
                experience_points=50,
                next_level_xp=200,
                current_streak_days=3,
                longest_streak_days=7,
                total_workouts=15,
                total_exercise_count=45,
                total_calories_burned=1200,
                total_weight_lifted_kg=2250.0
            )
            
            session.add(demo_stats)
            await session.commit()
            
            logger.info("✅ Demo user created successfully")
            logger.info("   Email: demo@sweatbot.com")
            logger.info("   Username: demo_user")
            return True
            
    except Exception as e:
        logger.error(f"❌ Failed to create demo user: {e}")
        return False

async def verify_setup():
    """Verify the database setup is working"""
    try:
        async with AsyncSessionLocal() as session:
            # Test basic query
            result = await session.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            
            result = await session.execute(text("SELECT COUNT(*) FROM gamification_stats"))
            stats_count = result.scalar()
            
            logger.info(f"✅ Database verification successful")
            logger.info(f"   Users: {user_count}")
            logger.info(f"   Gamification stats: {stats_count}")
            
            return True
            
    except Exception as e:
        logger.error(f"❌ Database verification failed: {e}")
        return False

async def main():
    """Main initialization function"""
    logger.info("🚀 Starting SweatBot database initialization...")
    
    try:
        # Step 1: Check/create database
        logger.info("\n📋 Step 1: Checking database connection...")
        db_exists = await create_database_if_not_exists()
        
        # Step 2: Create tables
        logger.info("\n📋 Step 2: Creating database tables...")
        tables_created = await create_tables()
        
        if not tables_created:
            logger.error("❌ Failed to create tables. Exiting.")
            return False
        
        # Step 3: Create demo user
        logger.info("\n📋 Step 3: Creating demo user...")
        demo_created = await create_demo_user()
        
        # Step 4: Verify setup
        logger.info("\n📋 Step 4: Verifying setup...")
        verified = await verify_setup()
        
        if verified:
            logger.info("\n🎉 Database initialization completed successfully!")
            logger.info("\n📚 Next steps:")
            logger.info("   1. Start the backend: cd backend && uvicorn app.main:app --reload")
            logger.info("   2. Visit http://localhost:8000/health to test")
            logger.info("   3. Visit http://localhost:8000/docs for API documentation")
            logger.info("   4. Test with demo user: demo@sweatbot.com")
            return True
        else:
            logger.error("❌ Database initialization failed during verification")
            return False
            
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False
    
    finally:
        # Close database connections
        await engine.dispose()

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)