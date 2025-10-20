"""
Database configuration and session management
Using SQLAlchemy with async support
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.pool import NullPool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create async engine
# Ensure asyncpg driver is used, but don't double-replace if already present
database_url = settings.DATABASE_URL
if not database_url.startswith("postgresql+asyncpg://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://")

engine = create_async_engine(
    database_url,
    echo=settings.DEBUG,
    future=True,
    pool_size=settings.get_db_settings()["pool_size"],
    max_overflow=settings.get_db_settings()["max_overflow"],
    pool_pre_ping=settings.get_db_settings()["pool_pre_ping"],
    pool_recycle=settings.get_db_settings()["pool_recycle"],
    connect_args={"server_settings": {"jit": "off"}}  # Disable JIT for compatibility
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
async def get_db():
    """
    Dependency to get database session
    Yields an async database session
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

# Initialize database
async def init_db():
    """
    Initialize database tables
    Creates all tables defined in models (with checkfirst=True to skip existing)
    """
    async with engine.begin() as conn:
        # Use checkfirst=True to avoid errors when tables/indexes already exist
        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(sync_conn, checkfirst=True))
    logger.info("Database tables initialized (existing tables preserved)")

# Alias for compatibility with main.py
async def create_database_tables():
    """
    Create database tables - alias for init_db
    """
    await init_db()

# Close database connections
async def close_db():
    """
    Close all database connections
    Called on application shutdown
    """
    await engine.dispose()
    logger.info("Database connections closed")