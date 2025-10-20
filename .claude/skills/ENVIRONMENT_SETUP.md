# 🔐 SweatBot Environment & Secrets Setup

**Purpose**: Configure environment variables and secrets for local development and production deployment

**Time Investment**: 10-15 minutes for full setup, 2 minutes for quick setup

---

## 📋 Quick Reference

| Variable | Purpose | Where Set | Required |
|----------|---------|-----------|----------|
| `DATABASE_URL` | PostgreSQL connection | Render (auto) | Yes |
| `DOPPLER_SERVICE_TOKEN` | Doppler auth | Render + local | Yes (prod) |
| `DOPPLER_PROJECT` | Doppler project | render.yaml | Yes (prod) |
| `DOPPLER_CONFIG` | Doppler environment | render.yaml | Yes (prod) |
| `SECRET_KEY` | API token signing | Doppler | Yes |
| `DEBUG` | Debug mode | render.yaml | Yes |
| `REDIS_URL` | Redis cache | Optional | No |
| `MONGODB_URL` | MongoDB connection | Optional | No |

---

## 🏃 Quick Setup (2 minutes)

### For Local Development:

1. Copy environment template:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env`:
   ```bash
   # Keep these values for local dev
   DEBUG=true
   SECRET_KEY=local-dev-key-change-in-production
   ```

3. Start locally:
   ```bash
   npm run dev
   ```

Done! ✅ Your local env is configured.

---

## 🔒 Production Setup with Doppler (10 minutes)

### Why Doppler?
- ✅ Secrets never in code or environment variables
- ✅ Automatic sync to production
- ✅ Easy rotation of secrets
- ✅ Audit trail of changes
- ✅ Free tier available

### Step 1: Create Doppler Account

1. Go to **https://doppler.com**
2. Sign up (free tier available)
3. Create project named `sweatbot`
4. Create config named `prd` (production)

---

### Step 2: Set Secrets in Doppler

In Doppler dashboard, add these secrets to `sweatbot/prd`:

```
SECRET_KEY = <generate-random-key>
DEBUG = false
REDIS_URL = <your-redis-url-if-using>
MONGODB_URL = <your-mongo-url-if-using>
```

To generate SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

Save in Doppler.

---

### Step 3: Create Doppler Service Token

1. In Doppler dashboard, go to `sweatbot/prd`
2. Click **"Access"** tab
3. Click **"Generate Service Token"**
4. Name it: `render-sweatbot`
5. Copy the token (looks like: `dp.st_prd_xxx...`)

---

### Step 4: Add Token to Render

1. Go to your Render web service
2. Click **"Environment"** tab
3. Add new variable:
   ```
   DOPPLER_SERVICE_TOKEN = <paste-token-from-step-3>
   ```
4. Click **"Save"**
5. Service redeploys automatically

---

### Step 5: Verify Production Secrets

After redeploy:
```bash
curl https://your-service-name.onrender.com/health
```

Should return: `{"status": "ok", "database": "connected"}`

If it fails, check logs for Doppler errors.

---

## 🔄 Alternative: Environment Variables Only

If you don't want to use Doppler, set variables directly in Render:

1. Go to web service → **Environment**
2. Add each variable manually:

```
SECRET_KEY = <your-secret-key>
DEBUG = false
REDIS_URL = <your-redis-url>
MONGODB_URL = <your-mongo-url>
```

**Note**: Less secure than Doppler, but works for development

---

## 📝 Complete Environment File Reference

### backend/.env (Local Development)

```bash
# Server
DEBUG=true
SECRET_KEY=local-dev-secret-key-here
PORT=8000

# Database
DATABASE_URL=postgresql://sweatbot:password@localhost:5432/sweatbot

# Optional Services
REDIS_URL=redis://localhost:6379/0
MONGODB_URL=mongodb://localhost:27017/sweatbot

# Doppler (optional for local)
DOPPLER_PROJECT=sweatbot
DOPPLER_CONFIG=dev
DOPPLER_SERVICE_TOKEN=<not-needed-for-local>

# API Keys (if needed)
OPENAI_API_KEY=<your-key>
GROQ_API_KEY=<your-key>
ANTHROPIC_API_KEY=<your-key>
```

---

## 🔑 Generating Secure Keys

### Generate SECRET_KEY:
```bash
# Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Result: Example output
# Ps7Q-K8_L9mN0oP1qR2sT3uV4wX5yZ6aB7cD8eF9gH0iJ1
```

### Generate Database Password:
```bash
# Python
python3 -c "import secrets; print(secrets.token_urlsafe(16))"
```

Copy these into Doppler secrets.

---

## 🧪 Verify Environment Setup

### Test Local Environment:
```bash
# From project root
cd backend

# Start app
python -m uvicorn app.main:app --reload

# In another terminal
curl http://localhost:8000/health
```

Expected: `{"status": "ok"}`

### Test Production Environment:
```bash
# Replace your-service-name
curl https://your-service-name.onrender.com/health
```

Expected: `{"status": "ok", "database": "connected"}`

---

## 🔄 Updating Secrets

### Local:
1. Edit `backend/.env`
2. Restart local server

### Production (Doppler):
1. Go to Doppler dashboard
2. Edit secret in `sweatbot/prd`
3. Click **"Save"**
4. Service auto-redeploys with new secrets

### Production (Manual Env Vars):
1. Go to Render web service → Environment
2. Edit variable
3. Click **"Save"**
4. Service redeploys

---

## ⚠️ Important Security Notes

1. **Never commit .env files**
   ```bash
   # .gitignore should include:
   backend/.env
   .env
   ```

2. **Rotate secrets regularly**
   - Update SECRET_KEY quarterly
   - Rotate database passwords yearly
   - Regenerate API keys after team changes

3. **Different secrets per environment**
   - Dev environment: Less restrictive
   - Production: Strict, complex passwords
   - Test: Separate from production

4. **Limit secret access**
   - Only developers need Doppler access
   - Use service tokens for CI/CD
   - Audit secret changes

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| **502 Bad Gateway** | Check if DOPPLER_SERVICE_TOKEN is correct |
| **Database connection error** | Verify DATABASE_URL format and Doppler sync |
| **Secrets not updating** | Wait 1-2 minutes for Render to resync |
| **Local app crashes** | Check backend/.env exists and variables are set |

---

## 📚 Related Guides

- [QUICK_START.md](QUICK_START.md) - Deploy in 5 minutes
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Full deployment reference
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix deployment issues
