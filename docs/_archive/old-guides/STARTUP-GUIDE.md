# 🚀 SweatBot Startup Guide

## Quick Start (Development)

### 1. Start Database Services

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot

# Start databases with Doppler secrets
cd config/docker
doppler run -- docker-compose up -d
```

This starts:
- **PostgreSQL** on port 8001
- **MongoDB** on port 8002
- **Redis** on port 8003

### 2. Start Backend API

```bash
# In a new terminal
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/backend

# Start with Doppler secrets
doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs on: **http://localhost:8000**

### 3. Start Frontend

```bash
# In a new terminal
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/personal-ui-vite

# Install dependencies (first time only)
npm install

# Start frontend (with Doppler for API keys)
doppler run -- npm run dev
```

Frontend runs on: **http://localhost:8005**

---

## 🔐 Doppler Secrets Management

### All Secrets Stored Securely

**Database Credentials:**
- `POSTGRES_PASSWORD` - Secure 32-byte password
- `MONGODB_PASSWORD` - Secure 32-byte password
- `REDIS_PASSWORD` - Secure 32-byte password

**AI API Keys:**
- `OPENAI_API_KEY` - OpenAI API key (GPT-4o-mini)
- `GROQ_API_KEY` - Groq API key (LLaMA 3.3)
- `GEMINI_API_KEY` - Google Gemini API key

**Application Secrets:**
- `SECRET_KEY` - JWT signing key (64-byte)
- `DATABASE_URL` - Full PostgreSQL connection string
- `MONGODB_URL` - Full MongoDB connection string
- `REDIS_URL` - Full Redis connection string

**Configuration:**
- `DEBUG` - Debug mode (True/False)
- `LOG_LEVEL` - Logging level (INFO/DEBUG/WARNING)

### Doppler Commands

```bash
# View all secrets (values hidden)
doppler secrets

# View all secrets with values
doppler secrets --plain

# Add a new secret
doppler secrets set NEW_KEY="new_value"

# Delete a secret
doppler secrets delete OLD_KEY

# Download secrets to .env (for debugging only)
doppler secrets download --no-file --format env > .env.backup

# Switch to staging environment
doppler setup --config stg

# Switch to production environment
doppler setup --config prd
```

---

## 🧪 Testing the Setup

### Health Checks

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed health check
curl http://localhost:8000/health/detailed | python3 -m json.tool

# Test database connection
doppler run -- bash -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness -c "SELECT current_database();"'

# Test Redis connection
doppler run -- bash -c 'redis-cli -h localhost -p 8003 -a $REDIS_PASSWORD PING'

# Test MongoDB connection
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/" --eval "db.adminCommand({ping: 1})"'
```

---

## 🛑 Stopping Services

### Stop Databases Only

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/config/docker
docker-compose down
```

### Stop Backend
```bash
# Press Ctrl+C in the backend terminal
# Or find and kill the process:
pkill -f "uvicorn app.main:app"
```

### Stop Frontend
```bash
# Press Ctrl+C in the frontend terminal
# Or:
pkill -f "vite"
```

---

## 🔧 Development Workflow

### Starting a Dev Session

```bash
# Terminal 1: Databases
cd config/docker && doppler run -- docker-compose up -d

# Terminal 2: Backend
cd backend && doppler run -- python -m uvicorn app.main:app --reload

# Terminal 3: Frontend
cd personal-ui-vite && doppler run -- npm run dev
```

### Database Migrations

```bash
cd backend

# Create a new migration
doppler run -- alembic revision --autogenerate -m "description"

# Apply migrations
doppler run -- alembic upgrade head

# Rollback last migration
doppler run -- alembic downgrade -1
```

### Resetting All Data

```bash
# Stop all services
cd config/docker && docker-compose down -v

# Start fresh
doppler run -- docker-compose up -d

# Or use the Python script
cd backend && python scripts/reset_all_data.py
```

---

## 📊 Service Ports

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 8000 | FastAPI REST API |
| PostgreSQL | 8001 | Exercise data & statistics |
| MongoDB | 8002 | Conversation history |
| Redis | 8003 | Session cache |
| Frontend | 8005 | Vite React UI with Volt Agent |

---

## 🐛 Troubleshooting

### "Can't connect to database"
```bash
# Check if containers are running
docker ps --filter "name=sweatbot"

# Check container logs
docker logs sweatbot_postgres
docker logs sweatbot_redis
docker logs sweatbot_mongodb

# Verify Doppler secrets are loaded
doppler secrets --only-names
```

### "Authentication failed"
```bash
# Recreate databases with fresh passwords
cd config/docker
docker-compose down -v
doppler run -- docker-compose up -d
```

### "Module not found" errors
```bash
# Backend dependencies
cd backend && pip install -r requirements.txt

# Frontend dependencies
cd personal-ui-vite && npm install
```

---

## 🔒 Security Notes

### What's Secure Now:
- ✅ All passwords generated cryptographically (32-64 bytes)
- ✅ No secrets in git or code
- ✅ Secrets encrypted in Doppler cloud
- ✅ Audit trail for all secret access
- ✅ Environment-specific configs (dev/staging/prod)

### Still To Fix (Phase 1.1):
- ⚠️ API keys still exposed in frontend bundle (use backend proxy)
- ⚠️ Guest token auth insufficient (implement OAuth2 + JWT)

---

## 📝 Next Steps

1. ✅ **DONE:** Port configuration fixed
2. ✅ **DONE:** Doppler secrets management implemented
3. **TODO:** Implement backend AI proxy (TASK-92229)
4. **TODO:** Add conversation persistence (TASK-93966)
5. **TODO:** Implement proper authentication (TASK-82150)

---

**All database services now running securely with Doppler! 🎉**
