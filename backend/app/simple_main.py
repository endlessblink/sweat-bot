"""
Simplified SweatBot FastAPI Application
Minimal version for deployment testing
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SweatBot API",
    description="Hebrew Fitness Tracking API",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "SweatBot API is running!", "status": "working", "timestamp": "2025-10-18"}

@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "service": "SweatBot API",
        "version": "1.0.0",
        "environment": os.getenv("PYTHON_VERSION", "unknown")
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with environment info"""
    return {
        "status": "healthy",
        "service": "SweatBot API",
        "version": "1.0.0",
        "environment": {
            "python_version": os.getenv("PYTHON_VERSION", "unknown"),
            "debug": os.getenv("DEBUG", "unknown"),
            "database_url": "configured" if os.getenv("DATABASE_URL") else "missing",
            "redis_url": "configured" if os.getenv("REDIS_URL") else "missing",
            "gemini_key": "configured" if os.getenv("GEMINI_API_KEY") else "missing",
            "groq_key": "configured" if os.getenv("GROQ_API_KEY") else "missing"
        }
    }

@app.get("/api/v1/test")
async def test_endpoint():
    """Test endpoint for API functionality"""
    return {
        "message": "SweatBot API test endpoint working!",
        "status": "operational",
        "features": {
            "fastapi": "✅ Working",
            "cors": "✅ Working",
            "environment_variables": "✅ Checking...",
            "databases": "🔄 To be tested",
            "ai_services": "🔄 To be tested"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 Starting SweatBot Simple API on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)