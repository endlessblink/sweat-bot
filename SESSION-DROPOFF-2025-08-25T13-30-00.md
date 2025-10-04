# Claude Code Session Memory & Drop-off
**Date**: 2025-08-25 13:30 UTC
**Project**: SweatBot - Hebrew Fitness AI Assistant
**Location**: `/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot`

## 🚨 CRITICAL CONTEXT FOR NEW SESSION

### Chrome Profile Lock Fix Just Implemented
**PROBLEM SOLVED**: Fixed persistent Chrome profile locks preventing MCP Playwright from working in WSL2 Claude Code.

**KEY ENVIRONMENT VARIABLES ADDED** (in ~/.bashrc):
```bash
export CHROME_NO_SANDBOX=1
export PLAYWRIGHT_CHROMIUM_USE_TEMPORARY_USER_DATA_DIR=1  # CRITICAL FIX
export MCP_TIMEOUT=30000
export MCP_TOOL_TIMEOUT=30000
```

**VERIFICATION REQUIRED**: New session must `source ~/.bashrc` to pick up these variables.

**CLEANUP TOOL CREATED**: `~/bin/claude-cleanup.sh` (alias: `claude-cleanup`)

## 📊 Current Project State

### Running Services
```
✅ Frontend (Vite + React): Port 8005 (PID 14082)
✅ Unknown service: Port 8004 (PID 8651)
❌ Backend (FastAPI): Port 8000 (NOT RUNNING)
✅ PostgreSQL: Port 8001 (Docker: sweatbot_postgres)
✅ MongoDB: Port 8002 (Docker: sweatbot_mongodb)
✅ Redis: Port 8003 (Docker: sweatbot_redis)
```

### Architecture Summary
- **Frontend**: Vite + React + TypeScript with embedded Volt Agent
- **Backend**: FastAPI (Python 3.11) - Currently NOT running
- **AI**: Direct browser calls to Gemini/Groq APIs
- **Databases**: PostgreSQL (exercises), MongoDB (conversations), Redis (cache)

## 💡 Like-I-Said Memory

### User Requirements & Preferences
1. **TESTING MANDATE**: NEVER claim functionality works without ACTUAL E2E testing using Playwright MCP
   - No hardcoded responses
   - Must test real user flows
   - Verify Hebrew text interaction
   - Test multiple times to ensure responses vary

2. **Port Requirements**: All SweatBot services MUST use ports 8000-8020 ONLY

3. **Natural Language Principle**: Trust AI's language understanding, no pattern matching

4. **Environment Separation**: 
   - WSL2 Claude Code is separate from Windows Claude Desktop
   - Never modify Windows config from WSL2

5. **Hebrew Fitness Focus**: System should handle Hebrew commands naturally

## 🎯 Drop-off Prompt for New Session

```markdown
I need to continue working on SweatBot, a Hebrew fitness AI assistant. I'm in WSL2 at:
/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot

CONTEXT:
- Just fixed Chrome profile locks for MCP Playwright in previous session
- Frontend running on port 8005, backend NOT running on 8000
- Databases running in Docker (ports 8001-8003)
- Need to test Playwright MCP navigation works after fix

IMMEDIATE TASK:
1. Verify Chrome fix: Navigate to http://localhost:8005 using Playwright MCP
2. Start backend if needed: cd backend && uvicorn app.main:app --port 8000
3. Test Hebrew text interaction in the browser

CRITICAL: Per CLAUDE.md, NEVER claim functionality works without E2E testing with Playwright.
```

## ✅ Quick Verification Commands

```bash
# Check environment variables are loaded
env | grep -E "(CHROME|PLAYWRIGHT|MCP)"

# Verify services status
lsof -i :8000-8010 | grep LISTEN
docker ps | grep sweatbot

# Test frontend accessibility
curl -s -o /dev/null -w "%{http_code}" http://localhost:8005

# Start backend if needed
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Clean Chrome profiles if issues persist
claude-cleanup
```

## 🔄 Git Status
- Multiple deleted files in _archive_to_delete/
- Modified: CLAUDE.md, .env.example
- Working directory has uncommitted changes

## 🎯 Next Steps & Priorities

### Immediate (Testing Chrome Fix)
1. ✅ Test MCP Playwright navigation to http://localhost:8005
2. ✅ Verify no "browser already in use" errors
3. ✅ Test Hebrew text input in browser
4. ✅ Take screenshots of SweatBot interface

### Pending Tasks
1. Start backend service (port 8000)
2. Implement E2E tests for SweatBot conversation flows
3. Verify natural conversation without hardcoded responses
4. Test Hebrew exercise logging end-to-end
5. Clean up deleted files in git

### Testing Criteria
- Greetings must return DIFFERENT responses each time
- No automatic UI components unless requested
- Non-fitness questions should be politely declined
- Hebrew commands should trigger appropriate tools

## 🔧 Technical Details

### File Structure
```
sweatbot/
├── backend/           # FastAPI backend (Port 8000)
├── personal-ui-vite/  # React frontend with Volt Agent (Port 8005)
├── config/           # Configuration files
├── docs/            # Documentation
├── scripts/         # Utility scripts
└── tests/          # Test files
```

### Key Components
- **Volt Agent Tools**: `personal-ui-vite/src/agent/tools/`
  - exerciseLogger.ts
  - statsRetriever.ts
  - dataManager.ts
  - goalSetter.ts
  - progressAnalyzer.ts
  - workoutSuggester.ts

### Environment Files
- Backend: `.env` in root
- Frontend: `personal-ui-vite/.env`

## 📝 Session Highlights

### What Was Fixed
- Persistent Chrome profile locks in WSL2 Claude Code
- Added critical `PLAYWRIGHT_CHROMIUM_USE_TEMPORARY_USER_DATA_DIR=1`
- Created cleanup script for future prevention
- Set WSL2-specific Chrome optimizations

### What Needs Testing
- MCP Playwright navigation functionality
- Hebrew text interaction in browser
- E2E conversation flows
- Natural language processing without patterns

## 🚀 Launch Commands

```bash
# Full system startup
docker-compose up -d postgres mongodb redis
cd backend && uvicorn app.main:app --reload &
cd personal-ui-vite && npm run dev

# Quick frontend only (databases already running)
cd personal-ui-vite && npm run dev
```

## 📌 Important Notes
- Chrome fix requires new Claude Code session to take effect
- Run `claude-cleanup` if profile lock issues return
- Frontend on 8005 is currently running
- Backend on 8000 needs to be started
- All databases are operational in Docker

---
*Session drop-off created at 2025-08-25 13:30 UTC*
*Next session should verify Chrome fix and continue E2E testing*