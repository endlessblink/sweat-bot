# SweatBot Architecture Refactor - August 23, 2025

## Session Context
- **Date**: August 23, 2025
- **Purpose**: Fix SweatBot chat functionality and establish proper service architecture
- **Key Decision**: Dockerize AI agent service for consistency and better resource management

## Architecture Decisions

### Mixed Deployment Strategy
We established a three-layer architecture with mixed deployment:

1. **Data Layer (Docker Containers)**
   - PostgreSQL (port 8001): Exercise data, user profiles, achievements
   - MongoDB (port 8002): Conversation history, chat sessions
   - Redis (port 8003): Cache, session management, real-time data
   - **Rationale**: Stateful services need persistence and isolation

2. **Application Layer (PM2)**
   - Frontend (port 8004): Vite + React UI
   - Backend API (port 8000): FastAPI business logic
   - **Rationale**: Stateless services that can be easily restarted/updated

3. **AI Layer (Docker Container)**
   - AI Agent Service (port 8005): All ML/AI capabilities
   - **Rationale**: Better resource management, model caching, GPU support

### Why This Architecture?

**Benefits of Mixed Approach**:
- Database containers ensure data persistence
- PM2 for application layer allows rapid development
- AI in Docker provides resource isolation and model management
- Clear separation of concerns
- Easy to scale individual components

**AI Service Consolidation**:
- Single container manages all AI models (local and API)
- Includes: Whisper, Gemma3n, LLaVA 2, Gemini API, Groq API
- Future-proof for adding new models
- Centralized model caching and resource management

## Issues Fixed

### Backend CORS Configuration
- **Problem**: Pydantic couldn't parse comma-separated CORS_ORIGINS
- **Solution**: Used string field with property decorator for parsing
- **File**: `backend/app/core/config.py`

### Frontend Connection
- **Problem**: Frontend connecting to wrong port (8001 instead of 8005)
- **Solution**: Updated fetch URL in `SweatBotChat.tsx`

### Agent Service Status
- **Problem**: Agent running in degraded state via PM2
- **Solution**: Dockerizing for better initialization and resource management

## Implementation Progress

### Completed
- ✅ Fixed backend CORS parsing issue
- ✅ Updated frontend to correct agent port
- ✅ Documented new architecture in CLAUDE.md
- ✅ Created this memory file

### Next Steps
- Create Dockerfile for AI agent service
- Update docker-compose.yml
- Migrate from PM2 to Docker for agent
- Test complete setup

## Key Insights

1. **Service Separation**: Each layer (data, application, AI) has distinct responsibilities
2. **Resource Management**: Docker for resource-intensive services (databases, AI)
3. **Development Speed**: PM2 for application layer enables rapid iteration
4. **Consistency**: All stateful services in Docker ensures data persistence

## Commands for Reference

```bash
# Current service status
docker ps  # Shows PostgreSQL, MongoDB, Redis
pm2 list   # Shows frontend, backend, agent (to be migrated)

# After migration
docker-compose up -d  # Starts all Docker services including AI agent
pm2 start ecosystem.config.js --only "sweatbot-frontend,sweatbot-backend"
```

## Architecture Diagram
```
User → Frontend(PM2:8004) → Backend(PM2:8000) → Databases(Docker:8001-8003)
                                    ↓
                            AI Agent(Docker:8005)
```

This architecture provides a solid foundation for the SweatBot platform with clear separation of concerns and optimal resource utilization.