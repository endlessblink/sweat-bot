# 🚀 SweatBot Render Deployment Skill

**Version**: 2.0  
**Last Updated**: October 2025  
**Status**: Production Ready  
**Target Platform**: Render.com  

---

## 📋 Quick Reference

| Aspect | Details |
|--------|---------|
| **Backend** | FastAPI + Uvicorn (Python 3.11) |
| **Database** | PostgreSQL (Render managed) |
| **Deployment Method** | render.yaml + GitHub auto-deploy |
| **Time to Deploy** | 5-30 minutes |
| **Cost** | Free tier ($0/month) |
| **Secrets Manager** | Doppler CLI |
| **Health Checks** | `/health` endpoint |

---

## 🎯 Core Competencies

### 1. Render Platform Configuration
- **render.yaml Structure**: Defines services, databases, environment variables
- **Service Types**: Web service for FastAPI backend
- **Database Integration**: PostgreSQL automatic provisioning
- **Health Checks**: Automatic monitoring and restarts
- **Build Commands**: Optimized for 75% faster builds

### 2. Database Deployment
- **PostgreSQL Setup**: Render managed database
- **Connection Strings**: Automatic environment variable injection
- **Database Initialization**: Schema creation via migrations
- **User Management**: Default user provisioning
- **Backup Strategy**: Render automated backups

### 3. Environment & Secrets Management
- **Environment Variables**: Non-sensitive configuration
- **Doppler Integration**: Production secrets management
- **Service Tokens**: Secure authentication for Doppler
- **Local Development**: .env files for local testing
- **Production**: Doppler CLI for runtime injection

### 4. Build Optimization
- **Dependency Management**: Efficient pip installation
- **CPU-Only PyTorch**: Reduces build time by 75%
- **Wheel Caching**: Faster reinstallation
- **Memory Constraints**: Free tier optimization
- **Prebuilt Binaries**: Avoids compilation steps

### 5. Deployment Verification
- **Health Endpoint**: GET /health verification
- **API Testing**: POST endpoints functional check
- **Database Connection**: Query database from endpoint
- **WebSocket Testing**: Voice feature connectivity
- **Logs Monitoring**: Real-time deployment debugging

### 6. Troubleshooting & Resolution
- **Build Failures**: Dependency conflicts, Python version
- **Database Errors**: Connection string, user permissions
- **Runtime Issues**: Memory limits, timeout configurations
- **WebSocket Problems**: HTTPS/WSS requirements
- **Spin-Down Recovery**: Cold start optimization

---

## 📁 File Structure

```
sweatbot/
├── render.yaml                    # Main deployment config
├── Procfile                       # Process definitions
├── backend/
│   ├── requirements.txt           # Python dependencies
│   ├── app/
│   │   ├── main.py               # FastAPI app entry
│   │   └── routes/               # API endpoints
│   └── .env.example              # Environment template
├── .env                          # Local secrets (gitignored)
└── .claude/skills/
    ├── RENDER_DEPLOYMENT.md      # This file
    ├── QUICK_START.md            # 5-minute deployment
    ├── ENVIRONMENT_SETUP.md      # Secrets & variables
    ├── TROUBLESHOOTING.md        # Common issues & fixes
    ├── DOPPLER_SETUP.md          # Secrets management
    └── SCRIPTS/
        ├── deploy.sh             # Automated deployment
        ├── health-check.sh       # Verify deployment
        └── cleanup.sh            # Reset deployment
```

---

## 🚀 Quick Deploy (5 minutes)

### Prerequisites
- GitHub account with sweatbot repository
- Render account (free, no credit card)
- Git installed locally

### Steps

1. **Create Render Account**
   ```bash
   # Visit render.com, sign up with GitHub
   # Authorize Render to access your repositories
   ```

2. **Deploy Backend**
   - Go to render.com dashboard
   - Click "New +" → "Web Service"
   - Connect your sweatbot repository
   - Render auto-detects render.yaml
   - Click Deploy

3. **Create Database**
   - In same project, click "New +" → "PostgreSQL"
   - Name: `sweatbot-db`
   - Plan: Free
   - Click Create

4. **Add Secrets**
   - Get your Doppler service token
   - Add `DOPPLER_SERVICE_TOKEN` to environment variables
   - Render links database automatically via `render.yaml`

5. **Verify Deployment**
   ```bash
   # After ~10 minutes, check:
   curl https://your-service-name.onrender.com/health
   # Should return: {"status": "ok"}
   ```

Done! 🎉

---

## 🔑 Environment Variables

### Required (Auto-set by Render)
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Service port (auto-set to 10000)

### Required (Set manually)
- `DOPPLER_SERVICE_TOKEN` - Doppler authentication
- `DOPPLER_PROJECT` - "sweatbot"
- `DOPPLER_CONFIG` - "prd" (production)

### Optional (Set in Doppler or .env)
- `SECRET_KEY` - API authentication key
- `DEBUG` - Set to "false" for production
- `REDIS_URL` - Redis cache (optional)
- `MONGODB_URL` - MongoDB connection (optional)

---

## 🔍 Health Check Endpoints

Test your deployment with these endpoints:

```bash
# Basic health check
curl https://your-service-name.onrender.com/health

# API endpoint test
curl -X GET https://your-service-name.onrender.com/api/status

# Database connectivity
curl -X GET https://your-service-name.onrender.com/api/db-check

# WebSocket test (from browser console)
ws = new WebSocket('wss://your-service-name.onrender.com/ws');
ws.onopen = () => console.log('Connected!');
```

---

## 📊 render.yaml Reference

Key configuration in your `render.yaml`:

```yaml
services:
  - type: web
    name: sweat-bot
    env: python
    runtime: python-3.11
    plan: free
    buildCommand: "pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt"
    startCommand: "doppler run -- python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT"
    healthCheckPath: /health
    envVars:
      - key: DOPPLER_PROJECT
        value: sweatbot
      - key: DOPPLER_CONFIG
        value: prd
      - key: DATABASE_URL
        fromDatabase:
          name: sweatbot-db
          property: connectionString

databases:
  - name: sweatbot-db
    plan: free
    databaseName: sweatbot
    user: sweatbot
```

---

## 🔄 Continuous Deployment

Once deployed, GitHub push automatically triggers:
1. Build detection from render.yaml
2. Dependency installation
3. Health check verification
4. Automatic rollback on failure

To update production:
```bash
git push origin main
# Render automatically deploys within 2-5 minutes
```

---

## ⚡ Performance Notes

**Build Time**: ~3-4 minutes (optimized)
- CPU-only PyTorch: 75% reduction vs. full torch
- Prebuilt wheels: Avoid compilation steps
- Pip caching: Faster reinstalls

**Spin-Down Behavior** (Free Tier):
- Inactive for 15 minutes → spins down
- First request: ~30 second cold start
- Subsequent requests: <100ms

**To Keep Always-On**:
- Option 1: Upgrade to Starter ($7/month)
- Option 2: Set up monitoring endpoint (calls /health every 10 minutes)
- Option 3: Use prod branch only for production use

---

## 📚 Next Steps

1. **Read**: [QUICK_START.md](QUICK_START.md) for step-by-step deployment
2. **Setup**: [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for secrets management
3. **Troubleshoot**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if deployment fails
4. **Automate**: Use [SCRIPTS](SCRIPTS/) for deployment automation

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| **Build fails** | Check `requirements.txt` versions, ensure python-3.11 compatible |
| **DB connection error** | Verify DATABASE_URL format, check Doppler service token |
| **WebSocket failing** | Ensure HTTPS/WSS protocol, check CORS headers |
| **Cold start slow** | Normal on free tier (30s), upgrade for always-on |
| **Out of memory** | Reduce dependencies, use CPU-only torch, check logs |

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Doppler Docs**: https://docs.doppler.com/
- **Project Logs**: Render dashboard → service → logs
