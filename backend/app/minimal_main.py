"""
Minimal SweatBot application for testing deployment
This version has minimal dependencies to ensure successful deployment
"""

from fastapi import FastAPI
from datetime import datetime
import os

app = FastAPI(
    title="SweatBot API - Test",
    description="Minimal test version",
    version="1.0.0-test"
)

@app.get("/")
async def root():
    return {
        "message": "SweatBot API - Test Version",
        "status": "working",
        "timestamp": datetime.utcnow().isoformat(),
        "features": ["Basic FastAPI", "Environment variable testing"]
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "sweatbot-api-test",
        "version": "1.0.0-test",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/debug/env")
async def debug_environment():
    """Debug endpoint to check environment variables"""
    api_keys = {
        "OPENAI_API_KEY": bool(os.getenv("OPENAI_API_KEY")),
        "GROQ_API_KEY": bool(os.getenv("GROQ_API_KEY")),
        "GEMINI_API_KEY": bool(os.getenv("GEMINI_API_KEY")),
        "ANTHROPIC_API_KEY": bool(os.getenv("ANTHROPIC_API_KEY")),
        "DOPPLER_PROJECT": os.getenv("DOPPLER_PROJECT"),
        "DOPPLER_CONFIG": os.getenv("DOPPLER_CONFIG"),
        "DATABASE_URL": bool(os.getenv("DATABASE_URL")),
        "MONGODB_URL": bool(os.getenv("MONGODB_URL")),
        "REDIS_URL": bool(os.getenv("REDIS_URL"))
    }

    return {
        "status": "debug",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "api_keys_loaded": api_keys,
        "all_env_vars_count": len(os.environ),
        "timestamp": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)