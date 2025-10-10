"""
SweatBot FastAPI Application
Main entry point for the Hebrew fitness tracking API
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import asyncio
import logging
import os
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

# Import our modules
from app.core.config import settings
from app.core.database import create_database_tables, engine, get_db
from app.api.v1 import auth, exercises, chat, onboarding, memory, profile
from app.api.v1.auth import get_current_user_ws
from app.api.endpoints import goals
from app.api import points
from app.api import points_v2
from app.api.v3 import points_router as points_v3_router
from app.websocket.handlers import websocket_endpoint
from app.websocket.connection_manager import connection_manager, periodic_cleanup
from app.models.models import User

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Lifespan events
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    
    # Startup
    logger.info("🚀 Starting SweatBot API...")
    
    try:
        # Create database tables
        await create_database_tables()
        logger.info("✅ Database tables created/verified")
        
        # Start background tasks
        cleanup_task = asyncio.create_task(periodic_cleanup())
        logger.info("✅ Background tasks started")
        
        # Warm up AI models (if needed)
        logger.info("🤖 Warming up AI models...")
        # This would initialize Whisper model in production

        # Initialize Points Engine v3
        logger.info("📊 Initializing Points Engine v3...")
        from app.services.points_engine_v3 import points_engine_v3
        await points_engine_v3.initialize()
        logger.info("✅ Points Engine v3 initialized")

        logger.info("✅ SweatBot API startup complete!")
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down SweatBot API...")
    
    try:
        # Cancel background tasks
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
        
        # Close database connections
        await engine.dispose()
        logger.info("✅ Database connections closed")
        
        logger.info("✅ SweatBot API shutdown complete!")
        
    except Exception as e:
        logger.error(f"❌ Shutdown error: {e}")

# Create FastAPI application
app = FastAPI(
    title="SweatBot API",
    description="Hebrew Fitness AI Tracker - Voice-enabled workout tracking with gamification",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "0.0.0.0", "*"] if settings.DEBUG else ["sweatbot.com", "*.sweatbot.com"]
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Health check endpoints
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    try:
        # Test database connection
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "service": "sweatbot-api",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "websocket_connections": len(connection_manager.active_connections),
            "debug_mode": settings.DEBUG
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": "sweatbot-api",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with component status"""
    from app.services.voice_service import VoiceService
    
    try:
        health_status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {}
        }
        
        # Test database
        try:
            from sqlalchemy import text
            async with engine.begin() as conn:
                result = await conn.execute(text("SELECT 1"))
                health_status["components"]["database"] = {
                    "status": "healthy",
                    "response_time_ms": 0  # Could measure actual time
                }
        except Exception as e:
            health_status["components"]["database"] = {
                "status": "unhealthy",
                "error": str(e)
            }
        
        # Test voice service
        try:
            voice_service = VoiceService()
            voice_health = await voice_service.health_check()
            health_status["components"]["voice_service"] = voice_health
        except Exception as e:
            health_status["components"]["voice_service"] = {
                "status": "unhealthy",
                "error": str(e)
            }
        
        # WebSocket status
        health_status["components"]["websocket"] = {
            "status": "healthy",
            "active_connections": len(connection_manager.active_connections),
            "connection_stats": connection_manager.get_connection_stats()
        }
        
        # Overall status
        unhealthy_components = [
            name for name, comp in health_status["components"].items() 
            if comp.get("status") != "healthy"
        ]
        
        if unhealthy_components:
            health_status["status"] = "degraded"
            health_status["unhealthy_components"] = unhealthy_components
        
        return health_status
        
    except Exception as e:
        logger.error(f"Detailed health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

# API Routes
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(exercises.router, prefix="/exercises", tags=["exercises"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(profile.router, prefix="/api/v1", tags=["profile"])
app.include_router(points.router, prefix="/api/points", tags=["points"])
app.include_router(points_v2.router, prefix="/api/points/v2", tags=["points-v2"])
app.include_router(points_v3_router, tags=["points-v3"])  # v3 includes prefix in router definition
app.include_router(goals.router, prefix="/api/goals", tags=["goals"])

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_handler(
    websocket: WebSocket,
    current_user: User = Depends(get_current_user_ws),
    db: AsyncSession = Depends(get_db)
):
    """Main WebSocket endpoint for real-time features"""
    await websocket_endpoint(websocket, current_user, db)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "SweatBot API - Hebrew Fitness AI Tracker",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "Documentation not available in production",
        "health": "/health",
        "websocket": "/ws",
        "features": [
            "Hebrew voice recognition",
            "Exercise tracking",
            "Real-time updates",
            "Gamification system",
            "Personal records tracking"
        ],
        "supported_languages": ["he", "en"],
        "debug_mode": settings.DEBUG
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not Found",
            "message": "The requested resource was not found",
            "path": str(request.url.path)
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred"
        }
    )

# Development-only endpoints
if settings.DEBUG:
    @app.get("/debug/info")
    async def debug_info():
        """Debug information (development only)"""
        return {
            "environment": os.environ.get("ENVIRONMENT", "development"),
            "debug": settings.DEBUG,
            "database_url": settings.DATABASE_URL.replace(settings.DATABASE_URL.split("@")[0].split("//")[1], "***"),
            "cors_origins": settings.CORS_ORIGINS,
            "websocket_stats": connection_manager.get_connection_stats(),
            "python_version": os.sys.version,
            "available_endpoints": [
                {"path": route.path, "methods": route.methods} 
                for route in app.routes 
                if hasattr(route, "path")
            ]
        }

if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=settings.DEBUG
    )