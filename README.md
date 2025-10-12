# SweatBot 💪 - Hebrew Fitness AI Tracker

An intelligent Hebrew fitness tracking system with natural language AI chat, exercise logging, and gamification.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 18+ (with npm or bun)
- Doppler CLI (for secrets management)

### Launch (3 Commands)

```bash
# 1. Start databases
cd config/docker && doppler run -- docker-compose up -d

# 2. Start backend (new terminal)
cd backend && doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 3. Start frontend (new terminal)
cd personal-ui-vite && doppler run -- npm run dev
```

**Access the app**: http://localhost:8005

### Quick Health Check
```bash
curl http://localhost:8000/health/detailed
```

## 🎯 What is SweatBot?

SweatBot is a **natural language fitness tracker** that understands Hebrew and English. Chat naturally with the AI to:
- Log exercises: *"עשיתי 20 סקוואטים"* or *"I did 20 squats"*
- Check stats: *"כמה נקודות יש לי?"* or *"How many points do I have?"*
- View history: *"מה האימונים שלי השבוע?"* or *"What are my workouts this week?"*
- Get insights: *"תראה לי את ההתקדמות שלי"* or *"Show me my progress"*

**No buttons. No forms. Just conversation.**

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (Vite + React)                    │
│  • Chat UI with Hebrew/English support                  │
│  • Volt Agent (AI orchestration framework)             │
│  • 5 SweatBot Tools (exercise logging, stats, etc.)    │
│  Port 8005                                              │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API
┌───────────────────────┴─────────────────────────────────┐
│              Backend (FastAPI + Python)                 │
│  • Exercise API endpoints                               │
│  • Statistics & workout history                         │
│  • Authentication & user management                     │
│  Port 8000                                              │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  ┌──────────┐    ┌──────────┐   ┌──────────┐
  │PostgreSQL│    │ MongoDB  │   │  Redis   │
  │ Exercise │    │   Chat   │   │  Cache   │
  │   Data   │    │ History  │   │          │
  │ Port 8001│    │Port 8002 │   │Port 8003 │
  └──────────┘    └──────────┘   └──────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Vite + React + TypeScript | UI and chat interface |
| **AI Framework** | Volt Agent | Tool orchestration and LLM routing |
| **Backend** | FastAPI + Python 3.11 | REST API and business logic |
| **Databases** | PostgreSQL, MongoDB, Redis | Exercise data, chat history, caching |
| **AI Models** | GPT-4o-mini, Llama 3.3 70B, Gemini 1.5 Pro | Natural language understanding |
| **Secrets** | Doppler | Environment variable management |

### Port Allocation

| Service | Port | Description |
|---------|------|-------------|
| Backend API | 8000 | FastAPI REST endpoints |
| PostgreSQL | 8001 | Exercise data storage |
| MongoDB | 8002 | Chat history persistence |
| Redis | 8003 | Session caching |
| Frontend | 8005 | Vite development server |

## 🎨 Key Features

### 1. Natural Language AI Chat
- **Bilingual**: Understands Hebrew and English naturally
- **No patterns**: LLM-powered, not keyword matching
- **Conversational**: Chat like you would with a personal trainer
- **Memory**: Remembers context across the conversation

### 2. Volt Agent Tool System
SweatBot has 5 specialized tools:
1. **exerciseLogger** - Logs exercises with automatic point calculation
2. **statsRetriever** - Fetches user statistics and points
3. **workoutDetails** - Shows workout history and patterns
4. **dataManager** - Resets/clears data (with confirmation)
5. **progressAnalyzer** - Analyzes trends and provides insights

### 3. Exercise Tracking
- Hebrew exercise name support
- Automatic point calculation
- Personal record detection
- Workout history with filtering

### 4. Unified Design System
- Consistent colors, typography, spacing
- Design tokens in `personal-ui-vite/src/design-system/`
- View components: http://localhost:8005/design-system

## 📁 Project Structure

```
sweatbot/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── api/               # REST API endpoints
│   │   ├── models/            # Database models
│   │   └── services/          # Business logic
│   ├── requirements.txt       # Python dependencies
│   └── scripts/               # Utility scripts
│
├── personal-ui-vite/          # Frontend (Vite + React)
│   ├── src/
│   │   ├── agent/             # Volt Agent configuration
│   │   │   ├── index.ts       # Agent initialization
│   │   │   └── tools/         # 5 SweatBot tools
│   │   ├── design-system/     # Design tokens
│   │   ├── components/        # React components
│   │   └── App.tsx            # Main app component
│   └── package.json
│
├── config/
│   └── docker/                # Docker Compose configuration
│       └── docker-compose.yml # Database services
│
├── docs/                      # Documentation
│   ├── main-docs/             # Comprehensive guides
│   └── screenshots-debug/     # Testing screenshots
│
├── CLAUDE.md                  # Development guidelines
├── README.md                  # This file
└── ARCHITECTURE.md            # Detailed technical docs
```

## 🛠️ Development

### Environment Setup

```bash
# Install Doppler CLI (if not installed)
# macOS
brew install dopplerhq/cli/doppler

# Linux
curl -sLf https://cli.doppler.com/install.sh | sh

# Login to Doppler
doppler login

# Setup project
doppler setup
```

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd personal-ui-vite
npm test
```

### Database Management

```bash
# Reset all data (use with caution)
python backend/scripts/reset_all_data.py

# Manual database access
docker exec -it sweatbot_postgres psql -U fitness_user -d hebrew_fitness
docker exec -it sweatbot_mongodb mongosh
docker exec -it sweatbot_redis redis-cli -a sweatbot_redis_pass
```

### Common Issues

#### "Database connection failed"
```bash
# Check containers are running
docker ps -a | grep sweatbot

# Restart with Doppler secrets
cd config/docker
docker-compose down
doppler run -- docker-compose up -d
```

#### "Port already in use"
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

#### "Frontend not loading"
```bash
# Reinstall dependencies
cd personal-ui-vite
rm -rf node_modules
npm install
```

## 📚 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guidelines for AI assistants
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed technical architecture
- **[docs/main-docs/](docs/main-docs/)** - Comprehensive documentation
  - Setup guides
  - API documentation
  - Testing guides
  - Deployment instructions

## 🧪 Testing Philosophy

**Key Principle**: Never claim functionality works without E2E testing.

- Use Playwright MCP for browser testing
- Test complete user flows end-to-end
- Verify responses are NOT hardcoded
- Always test with clean databases

## 🎯 Design Principles

### 1. Natural Conversation Over UI
- No forms unless absolutely necessary
- Chat-first interaction model
- AI understands intent from natural language

### 2. Infrastructure-First Debugging
When something breaks:
1. Check database health first
2. Verify environment variables loaded
3. Test service connectivity
4. Check authentication
5. Only then debug application code

### 3. Clean Data During Development
- Never add demo/placeholder data
- Always test with real user input
- Use reset scripts between test sessions

### 4. Design System Consistency
- Import design tokens, never hardcode
- Maintain visual consistency across components
- Use the design system preview for reference

## 🚀 Deployment

### Production Checklist
- [ ] Configure Doppler production environment
- [ ] Set up production databases
- [ ] Configure AI API keys (OpenAI, Groq, Gemini)
- [ ] Enable CORS for production domain
- [ ] Set up SSL/TLS certificates
- [ ] Configure monitoring and logging

### Environment Variables (via Doppler)
```bash
# Database connections
DATABASE_URL=postgresql+asyncpg://...
MONGODB_URL=mongodb://...
REDIS_URL=redis://...

# AI API Keys
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=...

# Security
JWT_SECRET_KEY=...
REDIS_PASSWORD=...
```

## 🤝 Contributing

See [CLAUDE.md](CLAUDE.md) for development guidelines.

### Key Guidelines
1. Use Like I Said MCP for task tracking
2. Follow infrastructure-first debugging protocol
3. Test with E2E tools before claiming functionality works
4. Use design system tokens, never hardcode values
5. Trust LLMs for natural language, avoid pattern matching

## 📄 License

MIT License - See LICENSE file for details.

---

**Built with modern AI-first architecture for natural fitness tracking in Hebrew 💪**
