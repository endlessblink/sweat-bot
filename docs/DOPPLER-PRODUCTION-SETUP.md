# Doppler Production Configuration for sweat-bot.com

Complete guide for setting up production secrets in Doppler for SweatBot deployment.

---

## 🔐 Required Doppler Secrets for Production

### Backend Secrets

Add these to your Doppler project (production config):

```bash
# Domain Configuration
CORS_ALLOWED_ORIGINS=http://localhost:8000,http://localhost:8001,http://localhost:8002,http://localhost:8003,http://localhost:8004,http://localhost:8005,http://localhost:8006,http://localhost:8007,http://localhost:8008,http://localhost:8009,http://localhost:8010,http://localhost:8011,http://localhost:8012,http://localhost:8013,http://localhost:8014,http://localhost:8015,http://localhost:8016,http://localhost:8017,http://localhost:8018,http://localhost:8019,http://localhost:8020,https://sweat-bot.com

# Environment
DEBUG=False
ENVIRONMENT=production

# Security
SECRET_KEY=<generate-secure-random-key>

# Database (keep existing values)
DATABASE_URL=postgresql+asyncpg://fitness_user:secure_password@localhost:8001/hebrew_fitness
REDIS_URL=redis://:sweatbot_redis_pass@localhost:8003/0

# AI Services (keep existing keys)
GEMINI_API_KEY=<your-existing-key>
GROQ_API_KEY=<your-existing-key>
OPENAI_API_KEY=<your-existing-key>

# Logging
LOG_LEVEL=INFO
```

### Frontend Secrets

Add these to Doppler for frontend build:

```bash
# Backend API URL (via Cloudflare Tunnel)
VITE_BACKEND_URL=https://api.sweat-bot.com

# Frontend URL
VITE_FRONTEND_URL=https://sweat-bot.com

# Environment
VITE_ENV=production

# API Version
VITE_API_VERSION=v1
```

---

## 📝 How to Update Doppler Secrets

### Option 1: Doppler Dashboard (Recommended)

1. Go to https://dashboard.doppler.com/
2. Select your SweatBot project
3. Select **production** config
4. Click **"Add Secret"** for each new variable
5. Update `CORS_ALLOWED_ORIGINS` to include `https://sweat-bot.com`

### Option 2: Doppler CLI

```bash
# Update CORS origins
doppler secrets set CORS_ALLOWED_ORIGINS="http://localhost:8000,http://localhost:8001,http://localhost:8002,http://localhost:8003,http://localhost:8004,http://localhost:8005,http://localhost:8006,http://localhost:8007,http://localhost:8008,http://localhost:8009,http://localhost:8010,http://localhost:8011,http://localhost:8012,http://localhost:8013,http://localhost:8014,http://localhost:8015,http://localhost:8016,http://localhost:8017,http://localhost:8018,http://localhost:8019,http://localhost:8020,https://sweat-bot.com" --config production

# Add frontend secrets
doppler secrets set VITE_BACKEND_URL="https://api.sweat-bot.com" --config production
doppler secrets set VITE_FRONTEND_URL="https://sweat-bot.com" --config production
doppler secrets set VITE_ENV="production" --config production

# Set production mode
doppler secrets set DEBUG="False" --config production
doppler secrets set ENVIRONMENT="production" --config production
```

---

## 🚀 Running Services with Doppler

### Backend (with Doppler)

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/backend

# Run with production config
doppler run --config production -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend (with Doppler)

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/personal-ui-vite

# Development mode with production API
doppler run --config production -- npm run dev

# Or build for production
doppler run --config production -- npm run build
```

### Docker Services (with Doppler)

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/config/docker

# Start databases with Doppler secrets
doppler run --config production -- docker-compose up -d
```

---

## ✅ Verification Checklist

After updating Doppler secrets, verify:

```bash
# Check backend CORS includes production domain
doppler secrets get CORS_ALLOWED_ORIGINS --config production

# Check frontend API URL
doppler secrets get VITE_BACKEND_URL --config production

# Verify all secrets are set
doppler secrets --config production
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Doppler manages all secrets
2. **Use `production` config** for live deployment
3. **Use `development` config** for local testing
4. **Rotate SECRET_KEY** periodically
5. **Keep API keys secure** in Doppler only

---

## 📋 Complete Startup Sequence

```bash
# 1. Start Docker databases
cd config/docker
doppler run --config production -- docker-compose up -d

# 2. Start backend API
cd ../backend
doppler run --config production -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

# 3. Start frontend
cd ../personal-ui-vite
doppler run --config production -- npm run dev &

# 4. Start Cloudflare Tunnel
cloudflared tunnel run sweatbot-production &

# Wait a moment, then test
sleep 5
curl https://api.sweat-bot.com/health
```

---

## 🔧 Troubleshooting

### Issue: CORS errors on production domain

**Check Doppler secret:**
```bash
doppler secrets get CORS_ALLOWED_ORIGINS --config production
```

**Should include:** `https://sweat-bot.com`

### Issue: Frontend can't connect to API

**Check Doppler secret:**
```bash
doppler secrets get VITE_BACKEND_URL --config production
```

**Should be:** `https://api.sweat-bot.com`

### Issue: Services using wrong config

**Verify Doppler config:**
```bash
# Check current config
doppler configure get

# Set to production
doppler configure set config production
```

---

## 📚 Doppler Resources

- Dashboard: https://dashboard.doppler.com/
- CLI Docs: https://docs.doppler.com/docs/cli
- SweatBot Project: Check your Doppler dashboard for project URL

---

**✅ Once Doppler is configured, all services will automatically use production secrets via `doppler run`!**
