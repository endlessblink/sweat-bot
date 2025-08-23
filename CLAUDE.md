# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SweatBot is a comprehensive Hebrew fitness tracking AI system featuring voice recognition, exercise tracking, real-time coaching, and gamification. The project has evolved through multiple architectural iterations:

- **Current Implementation**: Modern hybrid architecture with FastAPI backend, Next.js frontend, and Mastra AI framework
- **Legacy Systems**: Original Python desktop app (`hebrew-crossfit-ai/`) and intermediate hybrid (`hebrew-fitness-hybrid/`)
- **Development Framework**: BMAD Method (Business-Minded Agile Development) with Squad Engineering methodology

## IMPORTANT PORT CONFIGURATION
🎯 **STANDARDIZED PORT ALLOCATION (8000-8005 ONLY)**:
- **Port 8000**: Main SweatBot Backend (FastAPI with runtime fallback)
- **Port 8001**: Reserved for auxiliary services
- **Port 8002**: Personal SweatBot UI (Vite frontend)
- **Port 8003**: Available for additional services
- **Port 8004**: Available for additional services  
- **Port 8005**: Available for additional services

⚠️ **NO OTHER PORTS ALLOWED** - All SweatBot services must use ports 8000-8005 only

## Architecture & Technology Stack

### Core Technology Stack
- **Backend**: FastAPI + Python 3.11 + AsyncPG
- **Frontend**: Vite + React + TypeScript
- **Database**: PostgreSQL with SQLite fallback
- **Conversation Storage**: MongoDB for persistent chat history
- **Cache**: Redis for session management
- **AI Framework**: Phidata + Custom tools for agent orchestration
- **Voice Processing**: Whisper (ivrit-ai/whisper-large-v3) for Hebrew recognition
- **Real-time**: WebSocket connections via FastAPI
- **Deployment**: Mixed architecture (Docker for stateful services, PM2 for application layer)

### Service Architecture (Mixed Deployment)

```
╔══════════════════════════════════════════════════════════════╗
║                     APPLICATION LAYER (PM2)                  ║
╠═══════════════════════════════╤══════════════════════════════╣
║ Frontend (Vite)               │ Backend API (FastAPI)        ║
║ Port: 8004                    │ Port: 8000                   ║
║ - React UI                    │ - Business Logic             ║
║ - User Interface              │ - WebSocket Handler          ║
║ - Real-time Updates           │ - API Routes                 ║
╚═══════════════════════════════╧══════════════════════════════╝
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
╔══════════════════════════════════════════════════════════════╗
║                      DATA LAYER (DOCKER)                     ║
╠════════════════╤════════════════╤════════════════════════════╣
║ PostgreSQL     │ MongoDB        │ Redis                      ║
║ Port: 8001     │ Port: 8002     │ Port: 8003                ║
║ - Exercise Data│ - Conversations│ - Session Cache            ║
║ - User Stats   │ - Chat History │ - Real-time Data          ║
║ - Achievements │ - User Context │ - Temporary Storage        ║
╚════════════════╧════════════════╧════════════════════════════╝
                                          │
                                          ▼
╔══════════════════════════════════════════════════════════════╗
║                       AI LAYER (DOCKER)                      ║
╠═══════════════════════════════════════════════════════════════╣
║ AI Agent Service                                             ║
║ Port: 8005                                                   ║
║ ┌───────────────────────────┬────────────────────────────┐  ║
║ │ Local Models              │ External APIs              │  ║
║ ├───────────────────────────┼────────────────────────────┤  ║
║ │ • Whisper (Hebrew STT)    │ • Gemini API               │  ║
║ │ • Gemma3n (via Ollama)    │ • Groq API                 │  ║
║ │ • LLaVA 2 (Vision)        │ • OpenAI API (future)      │  ║
║ │ • Future Local Models     │ • Anthropic API (future)   │  ║
║ └───────────────────────────┴────────────────────────────┘  ║
╚═══════════════════════════════════════════════════════════════╝
```

### Data Flow
1. **User Interaction**: Frontend (8004) → Backend API (8000)
2. **Data Operations**: Backend API → PostgreSQL/MongoDB/Redis (8001-8003)
3. **AI Processing**: Backend API → AI Agent Service (8005)
4. **Model Selection**: AI Agent automatically selects best available model
5. **Response Flow**: AI Agent → Backend API → Frontend

### Deployment Strategy
- **Stateful Services (Docker)**: All databases and AI services that need persistent state
- **Stateless Services (PM2)**: Application logic that can be easily restarted/scaled
- **Benefits**: 
  - Database persistence and isolation
  - Easy application updates without data loss
  - Better resource management for AI models
  - Clear separation of concerns

## Development Commands

### 🚀 Unified Launch System (Recommended)
```bash
# Interactive mode selection (best for first-time users)
./start-sweatbot.sh

# Quick start options
./start-sweatbot.sh --mode=minimal     # Core AI chat only (~2min startup)
./start-sweatbot.sh --mode=standard    # Full features (~5min startup)  
./start-sweatbot.sh --mode=full        # Everything including ML models (~10min)
./start-sweatbot.sh --frontend-only    # UI development (~1min)

# Advanced options
./start-sweatbot.sh --debug            # Enable debug output
./start-sweatbot.sh --force-reinstall  # Clean dependency installation
./start-sweatbot.sh --help             # Show all options
```

### Legacy Launch Commands (Deprecated)
```bash
# Old launch scripts (still functional but replaced by unified system)
./launch-sweatbot-minimal.sh    # → Use --mode=minimal instead
./launch-sweatbot-fixed.sh      # → Use --mode=standard instead  
./launch-sweatbot.sh            # → Use --mode=full instead

# Docker Compose (alternative deployment)
docker-compose up -d

# Manual development mode
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
1. **Audio Capture**: Browser MediaRecorder API or sounddevice (desktop)
2. **Transmission**: WebSocket streaming to `/ws` endpoint or direct processing
3. **Processing**: Whisper model (`ivrit-ai/whisper-large-v3`) transcription
4. **Parsing**: `hebrew_parser_service.py` extracts exercise commands
5. **Storage**: PostgreSQL with Hebrew/English name mapping

### Voice Recording Support
**Desktop Voice Interface**: `voice_sweatbot.py`
- **Real-time Recording**: Uses sounddevice for live microphone input
- **Silence Detection**: Automatically stops recording after 2 seconds of silence
- **Hebrew Transcription**: Integrates with Whisper for Hebrew command recognition
- **Conversation Persistence**: All voice interactions saved to MongoDB

**System Requirements for Voice Recording**:
```bash
# Ubuntu/WSL2 - Install PortAudio system library
sudo apt-get install portaudio19-dev python3-pyaudio

# Install Python dependencies
pip install sounddevice soundfile pydub

# Test voice recording
python voice_sweatbot.py
```

**Voice Commands Examples**:
- `python voice_sweatbot.py` - Interactive voice mode
- Press ENTER to start voice recording
- Speak Hebrew: "עשיתי 20 סקוואטים"
- System auto-stops after silence, processes with PersonalSweatBot

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

### Intelligent Tool-Based Agent System
Located in `src/agents/`:
- **PersonalSweatBotWithTools**: Advanced AI agent with natural language understanding
- **Specialized Tools Architecture**: Each action handled by dedicated tools
- **No Command Memorization**: Understands intent from natural language

**Tool Architecture**:
```
src/agents/tools/
├── exercise_logger.py      # Logs exercises from natural language
├── statistics_retriever.py # Gets points, stats, and progress
├── data_manager.py         # Resets/clears data (with confirmation)
├── goal_setter.py          # Manages fitness goals
├── progress_analyzer.py    # Analyzes trends and insights
└── workout_suggester.py    # Suggests personalized workouts
```

**Natural Language Examples**:
- `"עשיתי 20 סקוואטים"` → Uses ExerciseLoggerTool automatically
- `"כמה נקודות יש לי?"` → Uses StatisticsRetrieverTool automatically
- `"אפס הכל"` → Uses DataManagerTool with confirmation
- `"מה לעשות היום?"` → Uses WorkoutSuggesterTool automatically

**Key Features**:
- **Intent Recognition**: AI understands various ways of saying the same thing
- **Tool Auto-Selection**: No need to remember specific commands
- **Safety Features**: Confirmations for destructive operations
- **Hebrew/English Support**: Handles both languages naturally
- **Context Awareness**: Uses conversation history for better understanding

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
- `src/agents/personal_sweatbot_with_tools.py`: **Advanced tool-based SweatBot (CURRENT)**
- `src/agents/personal_sweatbot_enhanced.py`: Legacy enhanced bot (deprecated)
- `src/agents/tools/`: Specialized tool modules for intelligent function calling

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

## Tool-Based Architecture (Current System)

### Overview
SweatBot now uses an **intelligent tool-based architecture** where the AI agent automatically selects the appropriate tool based on natural language input. Users don't need to memorize commands or specific syntax.

### How It Works
1. **User speaks naturally**: "עשיתי 20 סקוואטים" or "Show me my progress"
2. **AI understands intent**: Determines what the user wants to accomplish
3. **Tool auto-selection**: Chooses the appropriate tool automatically
4. **Action execution**: Tool handles the specific task (logging, retrieving stats, etc.)
5. **Natural response**: AI responds conversationally in Hebrew

### Available Tools & Natural Language Triggers

#### ExerciseLoggerTool
**Purpose**: Log exercises to database with point calculation
**Triggered by**:
- "עשיתי 20 סקוואטים" (I did 20 squats)
- "רצתי 5 קילומטר" (I ran 5 km)
- "סיימתי אימון רגליים" (Finished leg workout)
- "Just did 30 pushups"
- "Went for a 2km run"

#### StatisticsRetrieverTool
**Purpose**: Get points, progress, and workout statistics
**Triggered by**:
- "כמה נקודות יש לי?" (How many points do I have?)
- "מה ההתקדמות שלי?" (What's my progress?)
- "Show me my stats"
- "תראה לי את הסטטיסטיקות" (Show me the statistics)
- "How am I doing?"

#### DataManagerTool
**Purpose**: Reset points or clear data (with safety confirmations)
**Triggered by**:
- "אפס את הנקודות שלי" (Reset my points)
- "אני רוצה להתחיל מחדש" (I want to start over)
- "Delete my data"
- "Clear everything"
- "Start fresh"

#### GoalSetterTool
**Purpose**: Set and track fitness goals
**Triggered by**:
- "אני רוצה להגיע ל-100 נקודות השבוע" (I want to reach 100 points this week)
- "קבע לי יעד של 50 סקוואטים" (Set me a goal of 50 squats)
- "Set a running goal for me"
- "What are my current goals?"

#### ProgressAnalyzerTool
**Purpose**: Analyze trends and provide insights
**Triggered by**:
- "איך אני מתקדם?" (How am I progressing?)
- "תן לי תובנות על האימונים" (Give me insights about workouts)
- "Analyze my progress"
- "What are my patterns?"

#### WorkoutSuggesterTool
**Purpose**: Suggest personalized workouts
**Triggered by**:
- "מה לעשות היום?" (What should I do today?)
- "תציע לי אימון" (Suggest me a workout)
- "What should I do next?"
- "אני מתחיל, מה מומלץ?" (I'm starting, what's recommended?)

### Usage Examples

```python
# Initialize the advanced bot
from src.agents.personal_sweatbot_with_tools import PersonalSweatBotWithTools

bot = PersonalSweatBotWithTools()

# Natural conversations - no commands needed
bot.chat("עשיתי 25 סקוואטים")  # Logs exercise automatically
bot.chat("כמה נקודות יש לי?")    # Shows statistics automatically
bot.chat("מה לעשות עכשיו?")      # Suggests workout automatically
```

### Benefits of Tool-Based Architecture

1. **Natural Communication**: No need to learn specific commands
2. **Intent Understanding**: AI understands various phrasings of the same request  
3. **Automatic Tool Selection**: AI chooses the right tool behind the scenes
4. **Extensible**: Easy to add new tools for new functionality
5. **Safe Operations**: Confirmations built into destructive operations
6. **Multilingual**: Handles both Hebrew and English naturally
7. **Context Aware**: Uses conversation history for better understanding

### Developer Usage

When working with the tool-based system:
- **Use**: `PersonalSweatBotWithTools` (current)
- **Avoid**: `PersonalSweatBotEnhanced` (legacy, pattern-based)
- **Test**: Natural language input, not specific commands
- **Extend**: Add new tools to `src/agents/tools/` directory

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