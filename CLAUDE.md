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

## 🚨 CRITICAL: VERIFY BEFORE BUILDING NEW FEATURES 🚨

**ABSOLUTE RULE: NEVER build new features until existing functionality is 100% verified working.**

### Pre-Feature Development Checklist

Before building ANY new feature, you MUST verify these core functions work correctly:

✅ **Chat History Verification**:
- [ ] Login as user (noamnau / Noam123!)
- [ ] Send 5 different messages
- [ ] Verify each message saves to MongoDB
- [ ] Reload page and verify history persists
- [ ] Load old conversation and verify it displays
- [ ] Check MongoDB directly: `docker exec sweatbot_mongodb mongosh --eval "db.sweatbot_conversations.find().pretty()"`
- [ ] Test with Hebrew messages

✅ **Natural Conversation Verification**:
- [ ] Send "שלום" 3 times - must get DIFFERENT responses (not hardcoded)
- [ ] Send "עשיתי 20 סקוואטים" - verify exercise logs correctly
- [ ] Send "כמה נקודות יש לי" - verify shows REAL statistics (not demo data)
- [ ] Send non-fitness question ("מה השעה?") - verify polite decline
- [ ] Verify NO hardcoded templates appear
- [ ] Verify NO automatic UI components unless requested

✅ **Statistics Verification**:
- [ ] Reset all data: `python backend/scripts/reset_all_data.py`
- [ ] Log 5 different exercises through chat
- [ ] Verify points calculated correctly
- [ ] Verify statistics panel shows real data (not demo/placeholder)
- [ ] Test clear statistics button
- [ ] Reload page and verify data persists
- [ ] Check PostgreSQL: `psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness -c "SELECT * FROM exercises;"`

### Enforcement

**BEFORE starting ANY new feature task:**
1. Run verification checklist above
2. Document results (screenshots + logs)
3. Fix ANY issues found
4. Only proceed when ALL checks pass

**IF existing functionality is broken:**
- STOP feature development immediately
- Create URGENT bug fix task
- Fix the regression
- Re-verify everything works
- THEN continue with features

**Priority Order:**
1. **Verify existing features work** (chat, stats, history)
2. **Build Voice Control** (hands-free is essential for fitness)
3. **Build PWA/Mobile App** (mobile-first for fitness tracking)
4. **Build new features** (gamification, nutrition, etc.)

**NEVER:**
- Build features on top of broken functionality
- Assume existing code works without testing
- Skip verification to "save time"
- Add complexity before fixing bugs

**This prevents:** Building elaborate features on a broken foundation, wasting time debugging layered issues, loss of user trust from buggy releases.

## 🚨 CRITICAL: UNIFIED DESIGN SYSTEM ENFORCEMENT 🚨

**ABSOLUTE RULE: ALL UI components MUST use the unified design system. NEVER create competing or alternative design systems.**

### Design System Location
- **Tokens**: `src/design-system/tokens.ts`
- **Base Components**: `src/design-system/components/base/`
- **Visual Showcase**: Navigate to `http://localhost:8005/design-system`

### Design System Components Available
✅ **Base Components** (ALL ready to use):
- `Button` - Primary action component (variants: primary, secondary, danger, ghost)
- `Card` - Container component (variants: default, elevated, outlined)
- `Input` - Text input with RTL support
- `Avatar` - User/bot avatars (sizes: sm, md, lg, xl)
- `Badge` - Status indicators (variants: default, primary, success, danger)
- `IconButton` - Icon-only buttons

### Mandatory Import Pattern
```typescript
// ALWAYS import from design system
import { designTokens } from '../design-system/tokens';
import { Button, Card, Input } from '../design-system/components/base';
```

### FORBIDDEN Practices
❌ **NEVER hardcode design values**:
```typescript
// WRONG - Will be REJECTED:
color: "#FFFFFF"
padding: "16px"
fontSize: "14px"
backgroundColor: "rgb(26, 26, 26)"
```

✅ **ALWAYS use design tokens**:
```typescript
// CORRECT - The ONLY acceptable way:
color: designTokens.colors.text.primary
padding: designTokens.spacing[4]
fontSize: designTokens.typography.fontSize.sm
backgroundColor: designTokens.colors.background.secondary
```

### Token Categories
**Available token categories** (see `/design-system` for complete list):
- `designTokens.colors.*` - All colors (background, text, border, interactive, semantic)
- `designTokens.typography.*` - Font families, sizes, weights, line heights
- `designTokens.spacing.*` - Spacing scale (0-16 based on 4px grid)
- `designTokens.borderRadius.*` - Border radius values
- `designTokens.shadows.*` - Shadow definitions
- `designTokens.layout.*` - Layout dimensions
- `designTokens.transitions.*` - Transition timings

### Enforcement Rules
1. **NO hardcoded values** - Any PR with hardcoded colors/spacing/typography will be REJECTED
2. **NO competing design systems** - Only ONE design system (`src/design-system/`)
3. **NO inline color values** - Use tokens exclusively
4. **NO CSS variables** unless they reference design tokens
5. **NO custom spacing** - Use the spacing scale (1-16)

### How to Use the Design System
1. **View components**: Navigate to `http://localhost:8005/design-system`
2. **Copy code**: Click any code snippet to copy to clipboard
3. **Import tokens**: Always import `designTokens` first
4. **Use components**: Import and use base components when possible
5. **Check showcase**: If unsure, check the design system showcase

### Component Creation Rules
When creating NEW components:
1. **Check if base component exists** - Don't recreate Button, Card, etc.
2. **Use design tokens ONLY** - Never hardcode values
3. **Compose from base components** - Build on existing components
4. **Add to design system** - If it's reusable, add it to `/design-system/components/`
5. **Update showcase** - Add examples to `/design-system` page

### Visual Design System Showcase
Access at: `http://localhost:8005/design-system`
- View all colors, typography, spacing
- See all components with variants
- Copy code snippets with one click
- Interactive component examples
- Complete usage guidelines

**This is the SINGLE SOURCE OF TRUTH for all UI design. No exceptions.**

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

### 🎉 Recent Improvements (October 2025)
- ✅ **Doppler Secrets Management**: All 15 secrets (passwords, API keys) securely managed
- ✅ **MongoDB Conversation Persistence**: Chat history survives page refreshes
- ✅ **Port Configuration Fixed**: Aligned Docker ports with backend defaults
- ✅ **Composite Database Indexes**: 40-70% faster query performance
- ✅ **Dynamic AI SDK Imports**: 37% smaller bundle (~300KB savings)
- ✅ **Removed volt-models Service**: Saved 2GB RAM
- ✅ **Consolidated Duplicate Fields**: Cleaner User model (removed hashed_password, last_login)

- **Current Implementation**: Hybrid architecture with FastAPI backend (Python) for data operations and Volt Agent (TypeScript) for AI orchestration
- **AI Integration**: Direct browser calls to OpenAI/Groq/Gemini APIs with fallback chain (⚠️ Production requires backend proxy)
- **Database**: PostgreSQL (exercises & stats), MongoDB (conversation history), Redis (session cache)
- **Secrets Management**: Doppler CLI for secure environment variables (15 secrets managed)

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
  - OpenAI (gpt-4o-mini) - Primary (reliable tool calling)
  - Groq (llama-3.3-70b-versatile) - Fallback (free tier)
  - Google Gemini (gemini-1.5-pro) - Second fallback
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

### 🚀 Launch System (with Doppler Secrets)
```bash
# Start databases with Doppler secrets
cd config/docker
doppler run -- docker-compose up -d

# Start backend with Doppler (in one terminal)
cd backend
doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend with Doppler (in another terminal)
cd personal-ui-vite
npm install  # First time only
doppler run -- npm run dev  # Runs on port 8005 or 8007

# All secrets (API keys, passwords) managed by Doppler!
# No need to manually export environment variables
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

### Conversation Persistence ✅ RECENTLY IMPLEMENTED
**MongoDB Storage**: Accessed via FastAPI backend
- **Database**: Configured via Doppler `MONGODB_URL` secret
- **Collection**: `sweatbot_conversations`
- **Features**:
  - ✅ Session continuity across page refreshes
  - ✅ Automatic message persistence to MongoDB
  - ✅ Offline fallback to local cache
  - ✅ Last 20 messages loaded on initialization
- **Integration**: Frontend Volt Agent → Backend `/api/memory` → MongoDB
- **Implementation**: `personal-ui-vite/src/agent/index.ts` (lines 46-166)

### Volt Agent Tool System
**TypeScript-based tools** in `personal-ui-vite/src/agent/tools/`:
- **Intelligent Tool Selection**: AI automatically chooses the right tool
- **Natural Language Understanding**: No command memorization needed
- **Hebrew/English Support**: All tools handle both languages

**Available Tools** (5 implemented in `personal-ui-vite/src/agent/index.ts`):
```
Implemented Tools:
├── exerciseLogger       # Logs exercises with Hebrew recognition
├── statsRetriever       # Gets points, stats, and progress
├── workoutDetails       # Shows detailed workout history
├── dataManager          # Resets/clears data (with confirmation)
└── progressAnalyzer     # Analyzes trends and insights

Planned (not yet implemented):
├── goalSetter           # TODO: Manages fitness goals
└── workoutSuggester     # TODO: Suggests personalized workouts
```

**Natural Language Examples**:
- `"עשיתי 20 סקוואטים"` → Uses exerciseLogger automatically
- `"כמה נקודות יש לי?"` → Uses statsRetriever automatically
- `"מה האימונים שלי?"` → Uses workoutDetails automatically
- `"אפס הכל"` → Uses dataManager with confirmation
- `"תן לי ניתוח"` → Uses progressAnalyzer automatically

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

### Environment Variables (Managed by Doppler)

**All secrets are managed by Doppler CLI** - no manual `.env` files needed!

**Doppler Project:** `sweatbot`
**Config:** `dev` (development), `stg` (staging), `prd` (production)

**Secrets stored in Doppler (15 total):**
```bash
# Database Credentials (32-byte secure passwords)
POSTGRES_PASSWORD=<securely-generated>
MONGODB_PASSWORD=<securely-generated>
REDIS_PASSWORD=<securely-generated>

# Database Connection URLs (auto-interpolate passwords)
DATABASE_URL=postgresql+asyncpg://fitness_user:${POSTGRES_PASSWORD}@localhost:8001/hebrew_fitness
MONGODB_URL=mongodb://sweatbot:${MONGODB_PASSWORD}@localhost:8002/
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:8003/0

# AI API Keys
OPENAI_API_KEY=sk-proj-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...

# Application Secrets
SECRET_KEY=<64-byte-secure>  # JWT signing key
MONGODB_DATABASE=sweatbot_conversations

# Configuration
DEBUG=True
LOG_LEVEL=INFO
```

**View secrets:** `doppler secrets`
**Add secret:** `doppler secrets set KEY=value`
**Run with secrets:** `doppler run -- <command>`

### Docker Services (Database Layer Only)
- **postgres**: PostgreSQL database (port 8001)
- **mongodb**: MongoDB for conversations (port 8002)
- **redis**: Redis cache (port 8003)

**Note:** Backend and frontend run locally (not in Docker) for faster development.
**Note:** volt-models service was removed (unused, was wasting 2GB RAM).

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

#### workoutDetails Tool
**Purpose**: Show detailed workout history with dates and points
**Triggered by**:
- "מה האימונים שלי?" (What are my workouts?)
- "תראה לי את האימונים" (Show me the workouts)
- "איזה אימונים עשיתי?" (Which workouts did I do?)
- "Show me my workout history"

#### progressAnalyzer Tool
**Purpose**: Analyze trends and provide insights based on real data
**Triggered by**:
- "איך אני מתקדם?" (How am I progressing?)
- "תן לי תובנות על האימונים" (Give me insights about workouts)
- "Analyze my progress"
- "What are my patterns?"
- "תן לי ניתוח" (Give me analysis)

#### Planned Tools (Not Yet Implemented):
- **goalSetter**: Set and track fitness goals (planned)
- **workoutSuggester**: Suggest personalized workouts (planned)

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
- **Primary**: OpenAI GPT-4o-mini (direct from browser, dynamic import)
- **Fallback**: Groq API (direct from browser, dynamic import)
- **Second Fallback**: Gemini API (direct from browser, dynamic import)
- **Bundle Optimization**: Providers loaded dynamically (~300KB savings)
- **⚠️ Security Note**: API keys in frontend - production requires backend proxy (TASK-92229)


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