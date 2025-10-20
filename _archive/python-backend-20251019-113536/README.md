# Archived Python Backend

**Archive Date**: October 19, 2025
**Reason Archived**: Complete migration to Node.js + TypeScript backend
**Status**: Legacy - No longer maintained

## Overview

This directory contains the complete Python FastAPI backend that was previously used for SweatBot. This backend has been successfully replaced by a Node.js + TypeScript implementation.

## Technology Stack

- **Framework**: FastAPI + Python 3.11
- **Database**: PostgreSQL (primary), MongoDB (conversations), Redis (caching)
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: OpenAI, Groq, Gemini, Anthropic APIs
- **Deployment**: Previously configured for Render

## Key Features (Previously Implemented)

✅ **Complete REST API** - All CRUD operations for users, exercises, workouts
✅ **Real-time Chat** - WebSocket support for AI conversations
✅ **User Authentication** - JWT-based auth with refresh tokens
✅ **Exercise Tracking** - Comprehensive workout logging system
✅ **Points System** - Gamification with points and achievements
✅ **AI Integration** - Multiple AI provider support
✅ **Database Migrations** - Alembic-based schema management
✅ **Health Checks** - Comprehensive service monitoring

## Migration Details

### What was migrated:
- All API endpoints with identical functionality
- Database schemas (PostgreSQL, MongoDB, Redis)
- Authentication system (JWT tokens)
- AI provider integrations
- Exercise and workout tracking
- Points and gamification system

### What was improved:
- Better TypeScript type safety
- Simplified deployment configuration
- Enhanced error handling
- Improved performance
- Modern JavaScript ecosystem

## Directory Structure

```
backend/
├── app/                    # FastAPI application code
│   ├── main.py            # Application entry point
│   ├── api/               # API route definitions
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── middleware/        # Custom middleware
├── alembic/               # Database migrations
├── migrations/            # Alembic migration files
├── scripts/               # Utility scripts
├── tests/                 # Test suite
├── requirements*.txt      # Python dependencies
├── Dockerfile             # Docker configuration
└── start_server.py        # Server startup script
```

## Environment Variables

Key environment variables that were used:
- `DATABASE_URL` - PostgreSQL connection
- `MONGODB_URL` - MongoDB connection
- `REDIS_URL` - Redis connection
- `SECRET_KEY` - JWT signing key
- `OPENAI_API_KEY` - OpenAI API key
- `GROQ_API_KEY` - Groq API key
- `GEMINI_API_KEY` - Gemini API key
- `ANTHROPIC_API_KEY` - Anthropic API key

## Deployment

Previously deployed on Render.com using:
- FastAPI with Uvicorn ASGI server
- PostgreSQL database (Render managed)
- Docker containerization
- Automatic GitHub deployments

## Restoration (If Needed)

If you ever need to restore the Python backend:

1. Move this directory back to project root as `backend/`
2. Install dependencies: `pip install -r requirements.txt`
3. Set up environment variables
4. Run database migrations: `alembic upgrade head`
5. Start server: `python start_server.py` or `uvicorn app.main:app --host 0.0.0.0 --port 8000`

## Migration Notes

The Node.js backend maintains full API compatibility with this Python version. All endpoints, request/response formats, and database schemas remain the same to ensure seamless transition.

---

**Archived by**: Claude Code Assistant
**Migration completed**: October 19, 2025
**New backend location**: `backend-nodejs/` (soon to be moved to `backend/`)