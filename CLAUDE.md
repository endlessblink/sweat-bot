# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚨 CRITICAL: SCREENSHOT DIRECTORY REQUIREMENT 🚨

**MANDATORY SCREENSHOT LOCATION**: 
### ALL screenshots MUST be saved to: `/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/`

**NEVER save screenshots anywhere else!**

# ALWAYS CREATE AND UPDATE LIKE I SAID TASKS BEFORE DOING ANYTHING!!!

**Required Structure**:
```
docs/screenshots-debug/
├── test-session-YYYY-MM-DD/     # Create subfolder for each test session
├── e2e-tests/                   # E2E testing screenshots
├── ui-components/                # UI component testing
├── error-states/                 # Error and failure screenshots
└── performance/                  # Performance testing screenshots
```

**Why This Matters**:
- Centralized debugging artifacts
- Organized test history
- Easy to find and review past issues
- Prevents cluttering other directories
- Maintains clean project structure

## 🚨 CRITICAL: NO DEMO DATA DURING DEVELOPMENT 🚨

**ABSOLUTE RULE: NEVER add demo, static, or placeholder data to any database during development**

**Why this matters**:
- Demo data makes testing impossible (can't verify real functionality)
- Static responses hide bugs (looks working but isn't)
- Placeholder data ruins the debug cycle
- Pre-populated stats prevent proper E2E testing
- Fake data gives false confidence that features work

**FORBIDDEN During Development**:
- ❌ NO pre-populating databases with sample exercises
- ❌ NO hardcoded statistics like "150 points this week"
- ❌ NO fake workout history or achievements
- ❌ NO placeholder conversation history
- ❌ NO demo users with existing data

**Instead, ALWAYS**:
- ✅ Start with CLEAN databases (use reset script if needed)
- ✅ Test with REAL user input through the UI
- ✅ Verify ACTUAL data flow from frontend to backend
- ✅ Use the data reset endpoints when needed: `/api/v1/exercises/clear-all`
- ✅ Run `backend/scripts/reset_all_data.py` to wipe everything

**Quick Data Reset Commands**:
```bash
# Reset ALL data across all databases
python backend/scripts/reset_all_data.py

# Or manually:
docker exec sweatbot_postgres psql -U fitness_user -d hebrew_fitness -c "TRUNCATE TABLE exercises, workouts, personal_records, users CASCADE;"
docker exec sweatbot_mongodb mongosh --eval "use sweatbot_conversations; db.dropDatabase();"
docker exec sweatbot_redis redis-cli -a sweatbot_redis_pass FLUSHALL
```

## 🚨 CRITICAL TESTING REQUIREMENT 🚨

**NEVER claim the project is functional, working, operational, or ready for production without ACTUAL E2E TESTING using Playwright MCP or similar automated testing tools on the real frontend.**

⚠️ **PARAMOUNT RULE**: 
- DO NOT say "the system is working" based on:
  - Code inspection alone
  - Partial testing
  - Console logs
  - Screenshots without verification
  - Assumptions or inference
  - Unit tests or isolated component tests
  
✅ **ONLY claim functionality after**:
- Running actual E2E tests with Playwright MCP
- Testing real user interactions in the browser
- Verifying complete user flows end-to-end
- Confirming all components integrate correctly
- Testing multiple times to ensure responses are NOT hardcoded

**Testing Criteria for Natural Conversation**:
- ✅ Greeting ("Hi", "שלום") must return DIFFERENT responses each time (proves it's not hardcoded)
- ✅ NO UI components (buttons, quick actions) should appear unless explicitly requested
- ✅ Non-fitness questions ("מה השעה?", "What time is it?") should be politely declined
- ✅ Fitness requests should trigger appropriate tools ONLY when explicitly asked
- ✅ Conversation memory should persist across multiple messages

**ABSOLUTELY FORBIDDEN**:
- ❌ NO hardcoded responses ever (each "Hi" should get a unique response)
- ❌ NO automatic UI components for greetings
- ❌ NO templated messages like "אני SweatBot, הבוט האישי שלך..."
- ❌ NO quick action buttons unless user specifically asks for them
- ❌ NO claiming functionality works without Playwright testing

**Why this matters**: False claims of functionality lead to wasted time, broken deployments, and loss of trust. Always verify through automated E2E testing before making any claims about the system's operational status.

## 🚨 CRITICAL: Environment Configuration

**NEVER modify Windows Claude Desktop configuration from WSL2**

### Environment Setup
- **Windows**: Claude Desktop (DO NOT TOUCH)
  - Location: Windows AppData Claude Desktop config
  - MCP Servers: `desktop-commander`, `rough-cut-mcp`, etc.
  - Purpose: Windows-based development and automation
  - **WARNING**: Do not modify this from WSL2 - completely separate system

- **WSL2**: Claude Code CLI (WORKING ENVIRONMENT)
  - Location: `/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/`
  - Purpose: SweatBot development and testing
  - MCP System: Built-in Claude Code MCP servers (different from Desktop)
  - Configuration: Managed by Claude Code, not external config files

### Why This Matters
- Claude Desktop (Windows) and Claude Code (WSL2) are completely different systems
- They have different MCP server configurations and capabilities
- Modifying Windows Claude Desktop config from WSL2 is incorrect and ineffective
- Focus development work in WSL2 Claude Code environment only

## 🚨 CRITICAL: Natural Language Processing Principle

**NEVER use hardcoded pattern matching to "help" the AI understand language**

### Why This Matters
Modern LLMs (GPT-4o, Gemini, Claude) understand languages and context naturally. Adding pattern matching:
- Creates rigid, templated responses
- Prevents natural conversation  
- Interferes with tool selection
- Makes the system less intelligent

### Correct Approach
1. **Trust the AI**: It understands Hebrew, English, and context perfectly
2. **Clear prompts**: Give explicit instructions in the system prompt
3. **Simple tools**: Describe when to use, not complex conditions
4. **Remove patterns**: Delete keyword matching, use semantic understanding

### Example of What We Fixed
❌ **Wrong**: Pattern matching that returns "מעולה! איזה תרגיל עשית?" when user says "עשיתי 4 טיפוסי חבל"
✅ **Right**: AI understands "עשיתי 4 טיפוסי חבל" means log 4 rope climbs immediately

Remember: **The AI is smarter than your patterns. Let it work naturally.**

## Project Overview

SweatBot is a comprehensive Hebrew fitness tracking AI system featuring voice recognition, exercise tracking, real-time coaching, and gamification.

- **Current Implementation**: Hybrid architecture with FastAPI backend (Python) for data operations and Volt Agent (TypeScript) for AI orchestration
- **AI Integration**: Direct browser calls to Gemini/Groq APIs with fallback chain
- **Database**: PostgreSQL (exercises & stats), MongoDB (conversation history), Redis (session cache)

## 🎯 CRITICAL PORT CONFIGURATION
⚠️ **MANDATORY PORT RANGE: 8000-8020 ONLY**

**STANDARDIZED PORT ALLOCATION**:
- **Port 8000**: Main SweatBot Backend (FastAPI with runtime fallback)
- **Port 8001**: PostgreSQL Database  
- **Port 8002**: MongoDB (Conversation Storage)
- **Port 8003**: Redis (Session Cache)
- **Port 8004**: Reserved for future use
- **Port 8005**: Frontend with Volt Agent (Vite + React + TypeScript)
- **Port 8006**: Reserved for future local AI models (currently unused)
- **Port 8007**: Alternative frontend port
- **Ports 8008-8020**: Available for additional SweatBot services

🚨 **ABSOLUTE REQUIREMENT**: All SweatBot services, frontends, databases, and any related processes MUST use ports 8000-8020 ONLY. No exceptions.

**CORS Configuration**: Backend automatically allows localhost:8000-8020 range.

## Architecture & Technology Stack

### Core Technology Stack
- **Backend**: FastAPI (Python 3.11) - Port 8000 - Business logic, data operations, Hebrew parsing
- **Frontend**: Vite + React + TypeScript - Port 8005 - UI with embedded Volt Agent
- **AI Framework**: Custom Volt Agent (TypeScript) - Frontend-based AI orchestration
- **Cloud AI APIs**: 
  - Google Gemini (gemini-1.5-pro) - Primary
  - Groq (llama3-groq-70b-8192-tool-use-preview) - Fallback
- **Databases**:
  - PostgreSQL (Port 8001) - Exercise data & statistics
  - MongoDB (Port 8002) - Conversation history
  - Redis (Port 8003) - Session cache
- **Real-time**: WebSocket via FastAPI
- **Deployment**: Docker for databases, local dev for frontend/backend

### Service Architecture (Hybrid Deployment - Updated)

```
╔══════════════════════════════════════════════════════════════╗
║           FRONTEND LAYER (Local Development)                 ║
╠═══════════════════════════════════════════════════════════════╣
║ Frontend with Volt Agent (Vite + React + TypeScript)         ║
║ Port: 8005                                                   ║
║ - Custom Volt Agent implementation                          ║
║ - Direct API calls to Gemini/Groq                          ║
║ - 6 TypeScript tools for fitness tracking                   ║
║ - WebSocket connection to backend                           ║
╚═══════════════════════════════════════════════════════════════╝
            │                │                    │
      Gemini API        Groq API          Local Models
         (Direct)        (Direct)          (Port 8006)
            │                │                    │
            └────────────────┴────────────────────┘
                             │
╔══════════════════════════════════════════════════════════════╗
║                  BACKEND LAYER (Docker/Local)                ║
╠═══════════════════════════════════════════════════════════════╣
║ Backend API (FastAPI)                                        ║
║ Port: 8000                                                   ║
║ - Exercise Storage & Statistics                              ║
║ - User Management                                            ║
║ - Business Logic                                             ║
║ - Memory API for MongoDB                                     ║
╚═══════════════════════════════════════════════════════════════╝
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
╔══════════════════════════════════════════════════════════════╗
║                    DATA LAYER (DOCKER)                       ║
╠════════════════╤════════════════╤════════════════════════════╣
║ PostgreSQL     │ MongoDB        │ Redis                      ║
║ Port: 8001     │ Port: 8002     │ Port: 8003                ║
║ - Exercises    │ - Conversations│ - Sessions                ║
║ - User Stats   │ - Chat History │ - Cache                   ║
║ - Achievements │ - Context      │ - Real-time               ║
╚════════════════╧════════════════╧════════════════════════════╝
                             │
                             ▼
```

### Data Flow
1. **User Interaction**: Frontend (8005) with embedded Volt Agent
2. **Cloud AI**: Frontend → Direct to Gemini/Groq APIs (no proxy)
3. **Local Models**: Frontend → Volt Models Service (8006)
4. **Data Operations**: Frontend → Backend API (8000) → Databases (8001-8003)
5. **Memory**: Frontend → Backend → MongoDB for conversation persistence
6. **Response Flow**: AI responds directly in browser, UI updates instantly

### Deployment Strategy
- **Databases (Docker)**: PostgreSQL, MongoDB, Redis for persistence
- **Application Layer**: FastAPI backend and Vite frontend run locally
- **AI Layer**: Direct API calls from browser (no proxy needed)
- **Benefits**: 
  - Clean separation between data and logic
  - Fast development iteration
  - Lower memory footprint without local models

## Development Commands

### 🚀 Launch System
```bash
# Start databases
docker-compose up -d postgres mongodb redis

# Start backend (in one terminal)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend with Volt Agent (in another terminal)
cd personal-ui-vite
npm install  # First time only
npm run dev  # Runs on port 8005

# Environment variables needed in frontend
export VITE_GEMINI_API_KEY="your-gemini-key"
export VITE_GROQ_API_KEY="your-groq-key"
export VITE_LOCAL_MODELS_URL="http://localhost:8006"
export VITE_BACKEND_URL="http://localhost:8000"
```


### Alternative Launch Methods
```bash
# Docker Compose (all services)
docker-compose up -d

# Individual service startup
docker-compose up -d postgres mongodb redis
cd backend && uvicorn app.main:app --reload
cd personal-ui-vite && npm run dev
```


### Testing & Quality
```bash
# Backend testing
cd backend && pytest

# Full system health check
curl http://localhost:8000/health/detailed

# Frontend testing
cd personal-ui-vite && npm test
```

### Database Operations
```bash
# Initialize database
cd backend && python scripts/init_db.py

# Connect to PostgreSQL
psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness

# Connect to MongoDB
mongosh mongodb://sweatbot:secure_password@localhost:8002/
```

## Critical Implementation Details

### Hebrew Voice Recognition Flow
1. **Audio Capture**: Browser MediaRecorder API or sounddevice (desktop)
2. **Transmission**: WebSocket streaming to `/ws` endpoint or direct processing
3. **Processing**: Cloud-based AI transcription (future Whisper integration planned)
4. **Parsing**: `hebrew_parser_service.py` extracts exercise commands
5. **Storage**: PostgreSQL with Hebrew/English name mapping

### Voice Recording Support
**Browser-based Voice Interface**: Uses Web Audio API
- **Real-time Recording**: MediaRecorder API for browser recording
- **Hebrew Transcription**: Planned integration with cloud-based or local models (currently browser-only)
- **Conversation Persistence**: Stored in MongoDB via backend API

**Hebrew Command Examples**:
- `"עשיתי 20 סקוואטים"` → Logs 20 squats
- `"בק סקווט 50 קילו 5 חזרות"` → Back squat 50kg, 5 reps
- `"רצתי 5 קילומטר ב-25 דקות"` → 5km run in 25 minutes

### Conversation Persistence
**MongoDB Storage**: Accessed via FastAPI backend
- **Database**: `mongodb://sweatbot:secure_password@localhost:8002/`
- **Collection**: `sweatbot_conversations`
- **Features**: Session continuity, conversation history, context retrieval
- **Integration**: Frontend → Backend API → MongoDB

### Volt Agent Tool System
**TypeScript-based tools** in `personal-ui-vite/src/agent/tools/`:
- **Intelligent Tool Selection**: AI automatically chooses the right tool
- **Natural Language Understanding**: No command memorization needed
- **Hebrew/English Support**: All tools handle both languages

**Available Tools**:
```
personal-ui-vite/src/agent/tools/
├── exerciseLogger.ts      # Logs exercises with Hebrew recognition
├── statsRetriever.ts      # Gets points, stats, and progress
├── dataManager.ts         # Resets/clears data (with confirmation)
├── goalSetter.ts          # Manages fitness goals
├── progressAnalyzer.ts    # Analyzes trends and insights
└── workoutSuggester.ts    # Suggests personalized workouts
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
- **WebSocket Handler**: `backend/app/websocket/handlers.py` manages connections
- **Connection Manager**: `backend/app/websocket/connection_manager.py` handles client lifecycle
- **Event Types**: `exercise_update`, `achievement_unlocked`, `stats_update`, `challenge_complete`
- **Frontend Integration**: WebSocket client in React components

### Gamification System
**Core Components**:
- **Points Engine**: `backend/app/services/gamification_service.py` calculates exercise-based scoring
- **Achievement System**: Badge unlocks with Hebrew celebrations
- **Level Progression**: מתחיל → חובב → מתקדם → מומחה → אלוף
- **Challenges**: Daily/weekly goals with bonus multipliers
- **Personal Records**: Automatic PR detection and notifications

## Current Architecture

### Active Components
- **Backend**: `/backend/` - FastAPI (Python) on port 8000
- **Frontend**: `/personal-ui-vite/` - Vite + React + Volt Agent on port 8005
- **Databases**: PostgreSQL (8001), MongoDB (8002), Redis (8003)
- **Status**: Production-ready hybrid architecture

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://fitness_user:secure_password@postgres:5432/hebrew_fitness

# MongoDB (Conversation Storage)
MONGODB_URL=mongodb://sweatbot:secure_password@localhost:27017/
MONGODB_DATABASE=sweatbot_conversations

# AI Configuration (Frontend .env)
VITE_GEMINI_API_KEY=your_key_here
VITE_GROQ_API_KEY=your_key_here
VITE_BACKEND_URL=http://localhost:8000

# Security
SECRET_KEY=your-256-bit-secret-key
ALGORITHM=HS256

# Development
DEBUG=true
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:8000,http://localhost:8001,http://localhost:8002,http://localhost:8003,http://localhost:8004,http://localhost:8005,http://localhost:8006,http://localhost:8007
```

### Docker Services
- **postgres**: PostgreSQL database (port 8001)
- **mongodb**: MongoDB for conversations (port 8002)
- **redis**: Redis cache (port 8003)
- **volt-models**: Optional local AI models (port 8006)

## Important File Locations

### Core Business Logic
- `backend/app/main.py`: FastAPI application entry point
- `backend/app/services/hebrew_parser_service.py`: Hebrew command processing
- `backend/app/services/gamification_service.py`: Points and achievements
- `backend/app/models/models.py`: Database models and schemas

### Volt Agent (TypeScript) - NEW
- `personal-ui-vite/src/agent/index.ts`: Main Volt Agent initialization
- `personal-ui-vite/src/agent/tools/`: All 6 SweatBot tools in TypeScript
  - `exerciseLogger.ts`: Exercise logging with Hebrew support
  - `statsRetriever.ts`: Statistics and points retrieval
  - `dataManager.ts`: Data reset and management
  - `goalSetter.ts`: Goal setting and tracking
  - `progressAnalyzer.ts`: Progress analysis and insights
  - `workoutSuggester.ts`: Personalized workout suggestions
- `personal-ui-vite/src/agent/providers/`: AI provider implementations
  - `gemini.ts`: Direct Gemini API integration
  - `groq.ts`: Direct Groq API integration (tool-use models)
  - `localModels.ts`: Connection to port 8006 service
- `personal-ui-vite/src/agent/memory/mongoMemory.ts`: Conversation persistence interface

### Frontend Components  
- `personal-ui-vite/src/App.tsx`: Main application routing
- `personal-ui-vite/src/pages/Chat.tsx`: Chat interface with Volt Agent
- `personal-ui-vite/src/components/SweatBotChat.tsx`: SweatBot chat component

### Configuration & Data
- `data/session-history.json`: User session tracking
- `.env`: Backend environment variables
- `personal-ui-vite/.env`: Frontend environment variables

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

```typescript
// Initialize Volt Agent (happens automatically in frontend)
import { getSweatBotAgent } from './agent';

const agent = getSweatBotAgent();

// Natural conversations - no commands needed
await agent.chat("עשיתי 25 סקוואטים");  // Logs exercise automatically
await agent.chat("כמה נקודות יש לי?");   // Shows statistics automatically
await agent.chat("מה לעשות עכשיו?");      // Suggests workout automatically
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
- **Frontend AI**: Volt Agent in `personal-ui-vite/src/agent/`
- **Backend Logic**: FastAPI services in `backend/app/services/`
- **Test**: Natural language input, not specific commands
- **Extend**: Add new tools to `personal-ui-vite/src/agent/tools/`

## Development Principles

### Hebrew Language Support
- **Encoding**: Always use UTF-8 with proper locale settings
- **RTL Support**: CSS `direction: rtl` for Hebrew text
- **Dual Storage**: Store both Hebrew and English exercise names
- **Voice Processing**: Custom Hebrew grammar rules and number parsing

### AI Provider Management
- **Primary**: Gemini API (direct from browser)
- **Fallback**: Groq API (direct from browser)
- **Future**: Local models via port 8006 service
- **Caching**: Redis for conversation context


## Performance Considerations

### System Requirements
- **Memory**: 2GB+ RAM (cloud-based AI, no local models)
- **Storage**: 2GB+ for application and databases
- **Network**: Stable connection for API calls
- **Database**: PostgreSQL for production, SQLite for development

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