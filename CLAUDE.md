# CLAUDE.md

Claude Code development guidelines for the SweatBot project.

## 🚨 CRITICAL DEVELOPMENT RULES

### 1. Task Management
**ALWAYS CREATE AND UPDATE LIKE I SAID TASKS BEFORE DOING ANYTHING** - Track all work items.

### 2. Screenshot Directory
**ALL screenshots MUST be saved to**: `/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/`

### 3. No Demo Data
**NEVER add demo, static, or placeholder data during development**
- Demo data makes testing impossible
- Static responses hide bugs
- Use clean databases with REAL user input only
- Reset command: `python backend/scripts/reset_all_data.py`

### 4. Testing Requirements
**NEVER claim functionality works without ACTUAL E2E TESTING**
- Use Playwright MCP for browser testing
- Test complete user flows end-to-end
- Verify responses are NOT hardcoded (test multiple times)
- NO claims based on code inspection alone

### 5. Infrastructure-First Debugging
**When features appear broken, check infrastructure BEFORE application code:**
1. Database health (Docker containers running, not restarting)
2. Environment variables (Doppler secrets loaded)
3. Service connectivity (health endpoints responding)
4. Authentication flow (JWT tokens generated)
5. ONLY THEN check application code

**Golden Rule**: 10 minutes verifying infrastructure saves 10 hours debugging code.

### 6. Verify Before Building Features
**NEVER build new features until existing functionality is 100% verified**
- Test chat history persistence (MongoDB)
- Test natural conversation (no hardcoded responses)
- Test statistics (PostgreSQL data)
- Fix ALL regressions before adding complexity

### 7. Unified Design System
**ALL UI components MUST use the design system** (`src/design-system/`)
- Import from: `import { designTokens } from '../design-system/tokens'`
- NEVER hardcode colors, spacing, or typography
- View components at: `http://localhost:8005/design-system`

### 8. Natural Language Processing
**NEVER use hardcoded pattern matching** - Trust the AI to understand language naturally
- LLMs (GPT-4o, Gemini, Claude) understand Hebrew/English perfectly
- Patterns create rigid, templated responses
- Use clear system prompts, not keyword matching

### 9. Environment Configuration
**NEVER modify Windows Claude Desktop config from WSL2** - Separate systems
- WSL2: Development environment for SweatBot
- Windows: Claude Desktop (completely different MCP configuration)

## Port Configuration
**MANDATORY PORT RANGE: 8000-8020 ONLY**
- Port 8000: Backend API (FastAPI)
- Port 8001: PostgreSQL
- Port 8002: MongoDB
- Port 8003: Redis
- Port 8005: Frontend (Vite + React)

## Launch Commands

### With Doppler (Recommended)
```bash
# Start databases
cd config/docker && doppler run -- docker-compose up -d

# Start backend
cd backend && doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend
cd personal-ui-vite && doppler run -- npm run dev
```

### Quick Health Check
```bash
curl http://localhost:8000/health/detailed
```

## Architecture Quick Reference

### Tech Stack
- **Backend**: FastAPI (Python 3.11) - Port 8000
- **Frontend**: Vite + React + TypeScript - Port 8005
- **AI Framework**: Volt Agent (TypeScript, frontend-based)
- **Databases**: PostgreSQL (8001), MongoDB (8002), Redis (8003)
- **AI APIs**: OpenAI (gpt-4o-mini), Groq (llama-3.3-70b), Gemini (1.5-pro)

### Key Files
- `backend/app/main.py` - FastAPI entry point
- `personal-ui-vite/src/agent/index.ts` - Volt Agent initialization
- `personal-ui-vite/src/agent/tools/` - 5 SweatBot tools (TypeScript)
- `personal-ui-vite/src/design-system/` - Unified design tokens

### Volt Agent Tools (5 implemented)
1. **exerciseLogger** - Logs exercises with Hebrew support
2. **statsRetriever** - Gets points and statistics
3. **workoutDetails** - Shows workout history
4. **dataManager** - Resets/clears data (with confirmation)
5. **progressAnalyzer** - Analyzes trends and insights

## Development Workflow

1. **Check Infrastructure**: Verify Docker containers healthy
2. **Load Secrets**: Use Doppler for all environment variables
3. **Test Existing**: Verify core features work before building new ones
4. **Use Design System**: Import tokens, never hardcode values
5. **E2E Test**: Use Playwright to verify functionality
6. **Update Tasks**: Track progress with Like I Said MCP

## Common Issues

### "Database connection failed"
```bash
docker ps -a | grep sweatbot  # Check containers running
cd config/docker && doppler run -- docker-compose up -d
```

### "Port already in use"
```bash
lsof -ti:8000 | xargs kill -9  # Kill process on port 8000
```

### "Chat history not persisting"
```bash
# Verify MongoDB running with Doppler secrets
docker exec sweatbot_mongodb mongosh --quiet --eval "db.adminCommand('ping')"
```

## Documentation Structure
- **CLAUDE.md** (this file) - Development guidelines
- **README.md** - Project overview and quick start
- **ARCHITECTURE.md** - Detailed technical architecture
- **docs/main-docs/** - Comprehensive documentation

---

**For detailed architecture, API documentation, and deployment guides, see README.md and docs/main-docs/**
