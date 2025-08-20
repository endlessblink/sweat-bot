# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SweatBot is a comprehensive Hebrew fitness tracking AI system featuring voice recognition, exercise tracking, real-time coaching, and gamification. The project has evolved through multiple architectural iterations:

- **Current Implementation**: Modern hybrid architecture with FastAPI backend, Next.js frontend, and Mastra AI framework
- **Legacy Systems**: Original Python desktop app (`hebrew-crossfit-ai/`) and intermediate hybrid (`hebrew-fitness-hybrid/`)
- **Development Framework**: BMAD Method (Business-Minded Agile Development) with Squad Engineering methodology

## IMPORTANT PORT CONFIGURATION
⚠️ **PORT 3001 IS RESERVED** - DO NOT USE PORT 3001 for any services. It conflicts with other applications.
⚠️ **PORT 4444 MAY ALSO BE IN USE** - If port 4444 is taken, use port 4445 as the alternative.
✅ **PERSONAL SWEATBOT UI** - Currently running on port 4445 (personal-ui directory)

## Architecture & Technology Stack

### Core Technology Stack
- **Backend**: FastAPI + Python 3.11 + AsyncPG
- **Frontend**: Next.js 15 + TypeScript + React 19
- **Database**: PostgreSQL with SQLite fallback
- **Conversation Storage**: MongoDB for persistent chat history
- **Cache**: Redis for session management
- **AI Framework**: Mastra Core + Phidata for agent orchestration
- **Voice Processing**: Whisper (ivrit-ai/whisper-large-v3) for Hebrew recognition
- **Real-time**: WebSocket connections via FastAPI
- **Deployment**: Docker + Docker Compose with multiple profiles

### Service Architecture
```
Frontend (Next.js) → API Gateway (FastAPI) → Exercise Data (PostgreSQL)
       ↓                    ↓                      ↓
WebSocket Client ←→ WebSocket Handler ←→ Redis Cache
       ↓                    ↓                      ↓
Voice Processing ←→ PersonalSweatBot ←→ Conversation Storage (MongoDB)
                          ↓
                   Mastra AI Agents
```

### Dual-Database Architecture
```
PersonalSweatBot Agent
       ├─── MongoDBMemory ──→ Conversations & Chat History (MongoDB)
       └─── FastAPI Backend ──→ Exercise Data & Statistics (PostgreSQL)
```

## Development Commands

### Quick Start Commands
```bash
# Start complete system (Docker - Recommended)
docker-compose up -d

# Development mode (manual)
bun run dev              # Frontend on port 4000
bun run dev:backend      # Backend on port 8000

# Legacy systems
bun run dev:old-frontend # Old Next.js frontend
python run_hebrew_crossfit.bat  # Desktop app
```

### BMAD & Squad Engineering Commands
```bash
# BMAD Agents (Business-Minded Agile Development)
npm run bmad:analyst     # Business analysis
npm run bmad:pm          # Product management  
npm run bmad:architect   # System architecture
npm run bmad:developer   # Development tasks
npm run bmad:qa          # Quality assurance

# BMAD-Squad Integration
npm run bmad-squad:team        # Team coordination
npm run bmad-squad:feature     # Feature development
npm run bmad-squad:dashboard   # Unified dashboard
npm run bmad-squad:hebrew      # Hebrew optimization
npm run bmad-squad:mapping     # Role mapping summary

# Squad Engineering
npm run squad:init       # Initialize framework
npm run squad:status     # Check current status
npm run squad:sync       # Sync role communications
npm run squad:feature    # Create new feature
```

### Testing & Quality
```bash
# Backend testing
cd backend && pytest
python scripts/test_backend.py

# Full system health check
curl http://localhost:8000/health/detailed

# Legacy system tests
python test_hebrew_accuracy.py
python test_weight_tracking.py
```

### Database Operations
```bash
# Initialize database
python scripts/init_db.py

# Migration (legacy to current)
python migrations/migrate_to_postgres.py

# View data
python view_database.py
```

## Critical Implementation Details

### Hebrew Voice Recognition Flow
1. **Audio Capture**: Browser MediaRecorder API or sounddevice
2. **Transmission**: WebSocket streaming to `/ws` endpoint
3. **Processing**: Whisper model (`ivrit-ai/whisper-large-v3`) transcription
4. **Parsing**: `hebrew_parser_service.py` extracts exercise commands
5. **Storage**: PostgreSQL with Hebrew/English name mapping

**Hebrew Command Examples**:
- `"עשיתי 20 סקוואטים"` → Logs 20 squats
- `"בק סקווט 50 קילו 5 חזרות"` → Back squat 50kg, 5 reps
- `"רצתי 5 קילומטר ב-25 דקות"` → 5km run in 25 minutes

### MongoDB Conversation Persistence Architecture
Located in `src/agents/mongodb_memory.py`:
- **MongoDBMemory Class**: Extends Phidata AgentMemory with MongoDB backend
- **Session Management**: Automatic session detection with 2-hour timeout
- **Context Loading**: Retrieves recent conversations on bot startup
- **Metadata Extraction**: Exercise detection, language identification, statistics requests
- **Search & Analytics**: Full-text search and user behavior analysis

**Connection Details**:
- **Database**: `mongodb://sweatbot:secure_password@localhost:27017/`
- **Collection**: `sweatbot_conversations.conversations`
- **User Isolation**: Each user has separate conversation threads
- **Features**: Session continuity, conversation search, preference analysis

**Integration Flow**:
1. **PersonalSweatBot** → Uses `MongoDBMemory(user_id="personal")`
2. **Message Storage** → All conversations saved with metadata
3. **Context Retrieval** → Recent conversations loaded on startup
4. **Dual Persistence** → Exercises to PostgreSQL, conversations to MongoDB

### Mastra AI Agent System
Located in `src/mastra/`:
- **Fitness Coach Agent**: General fitness guidance and exercise recommendations
- **Adaptive Agent**: Personalized coaching based on user behavior patterns
- **Engaging Coach Agent**: Motivational responses and gamification feedback

Agents integrate with:
- `behavior-analyzer.ts`: User pattern recognition
- `user-preferences.ts`: Personalization system
- `exercise-logger.ts` & `stats-tracker.ts`: Data integration

### Real-time Features Architecture
- **WebSocket Handler**: `app/websocket/handlers.py` manages connections
- **Connection Manager**: `connection_manager.py` handles client lifecycle
- **Event Types**: `exercise_update`, `achievement_unlocked`, `stats_update`, `challenge_complete`
- **Frontend Integration**: `contexts/WebSocketContext.tsx` for React state management

### Gamification System
**Core Components**:
- **Points Engine**: `gamification_service.py` calculates exercise-based scoring
- **Achievement System**: Badge unlocks with Hebrew celebrations
- **Level Progression**: מתחיל → חובב → מתקדם → מומחה → אלוף
- **Challenges**: Daily/weekly goals with bonus multipliers
- **Personal Records**: Automatic PR detection and notifications

## Multi-Architecture Support

### Current Active System
- **Location**: `/backend/`, `/frontend/`, `/src/mastra/`
- **Status**: Production-ready with Mastra AI integration
- **Ports**: Backend 8000, Frontend 4000
- **Database**: PostgreSQL primary, SQLite fallback

### Legacy Systems (Maintained)
1. **Hebrew Crossfit AI**: `hebrew-crossfit-ai/`
   - Desktop tkinter application
   - SQLite database: `workout_data.db`
   - Direct model integration

2. **Hebrew Fitness Hybrid**: `hebrew-fitness-hybrid/`
   - Intermediate microservices architecture
   - Docker Compose deployment
   - Frontend port 4567, Backend port 8765

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://fitness_user:secure_password@postgres:5432/hebrew_fitness

# MongoDB (Conversation Storage)
MONGODB_URL=mongodb://sweatbot:secure_password@localhost:27017/
MONGODB_DATABASE=sweatbot_conversations

# AI Configuration  
WHISPER_MODEL_SIZE=base
GEMINI_API_KEY=your_key_here

# Security
SECRET_KEY=your-256-bit-secret-key
ALGORITHM=HS256

# Development
DEBUG=true
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000,http://localhost:4000
```

### Docker Profiles
- **default**: Development with hot reload
- **production**: Optimized production build with Nginx
- **monitoring**: Prometheus + Grafana metrics
- **storage**: MinIO object storage for media files

## Important File Locations

### Core Business Logic
- `backend/app/main.py`: FastAPI application entry point
- `backend/app/services/hebrew_parser_service.py`: Hebrew command processing
- `backend/app/services/gamification_service.py`: Points and achievements
- `backend/app/models/models.py`: Database models and schemas
- `src/agents/mongodb_memory.py`: MongoDB conversation persistence
- `src/agents/personal_sweatbot_enhanced.py`: PersonalSweatBot with MongoDB integration
- `src/mastra/agents/`: AI coaching agents

### Frontend Components
- `app/page.tsx`: Main application interface
- `components/VoiceRecorder.tsx`: Voice input handling
- `components/ExerciseLogger.tsx`: Exercise tracking UI
- `contexts/WebSocketContext.tsx`: Real-time communication

### Configuration & Data
- `data/behavior-patterns.json`: User behavior analytics
- `models/transformers/`: Cached Whisper models (5GB+)
- `gamification_data/`: Achievement and progress data
- `.bmad-core/`: BMAD agent configurations

## Development Principles

### Hebrew Language Support
- **Encoding**: Always use UTF-8 with proper locale settings
- **RTL Support**: CSS `direction: rtl` for Hebrew text
- **Dual Storage**: Store both Hebrew and English exercise names
- **Voice Processing**: Custom Hebrew grammar rules and number parsing

### Model Management
- **Singleton Pattern**: `hebrew_model_manager.py` prevents multiple loadings
- **Lazy Loading**: Models initialize on first use (30-second startup delay)
- **Memory Management**: ~5GB RAM requirement for Whisper model
- **Caching**: Redis for frequently accessed model outputs

### BMAD Development Workflow
1. **Analysis Phase**: Use `bmad:analyst` for requirement gathering
2. **Planning**: `bmad:pm` for feature prioritization
3. **Architecture**: `bmad:architect` for system design
4. **Development**: Role-specific BMAD agents guide implementation
5. **Testing**: `bmad:qa` for comprehensive validation

### Squad Coordination
- **Role Files**: `.squad/role-definition-*.md` define responsibilities
- **Communication**: `.squad/role-comm-*.md` track inter-role discussions
- **Synchronization**: Regular `squad:sync` ensures alignment
- **Planning**: Feature development follows squad methodology

## Performance Considerations

### System Requirements
- **Memory**: 8GB+ RAM (5GB for Whisper model)
- **Storage**: 10GB+ for models and data
- **Network**: Stable connection for real-time features
- **Database**: PostgreSQL recommended for production

### Optimization Strategies
- **Model Caching**: Redis for processed voice commands
- **Connection Pooling**: AsyncPG for database efficiency  
- **WebSocket Management**: Automatic cleanup of stale connections
- **Frontend**: Code splitting and lazy loading for initial performance

### Monitoring & Health Checks
- **Health Endpoints**: `/health` and `/health/detailed`
- **Component Status**: Database, Redis, WebSocket, Voice Service
- **Metrics**: Request latency, WebSocket connections, model processing time
- **Debug Mode**: Comprehensive logging and debug endpoints when `DEBUG=true`