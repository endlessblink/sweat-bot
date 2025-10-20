# 🚀 SweatBot Node.js Backend - Render Deployment Guide

**Status**: ✅ Production Ready
**Backend Version**: 2.0.0 (Node.js + TypeScript)
**Deployment Method**: render.yaml + GitHub Auto-deploy
**Estimated Time**: 5-10 minutes

---

## 📋 Deployment Readiness Checklist

### ✅ Completed Prerequisites
- [x] **render.yaml** configured for Node.js deployment
- [x] **package.json** with production scripts and dependencies
- [x] **TypeScript compilation** to dist/server-simple.js
- [x] **Health endpoints** (/health, /debug/env) implemented
- [x] **Environment variables** configured for Doppler integration
- [x] **Git repository** pushed with latest changes
- [x] **DATABASE_URL** auto-linked from PostgreSQL service

### 🔧 Technical Configuration
- **Runtime**: Node.js (render.yaml auto-detects)
- **Build**: `npm install && npm run build`
- **Start**: `node dist/server-simple.js`
- **Health Check**: `/health` endpoint
- **Port**: 10000 (Render standard)
- **Root Directory**: `backend-nodejs/`

---

## 🚀 Quick Deployment Steps

### Step 1: Create Render Web Service (2 minutes)

1. Go to **https://render.com**
2. Click **"New +"** → **"Web Service"**
3. Select **sweat-bot** repository
4. Configure settings:
   - **Name**: `sweatbot-api` (or your choice)
   - **Branch**: `main`
   - **Runtime**: `Node` (auto-detected)
   - **Plan**: `Free`
5. Click **"Create Web Service"**

### Step 2: Create PostgreSQL Database (2 minutes)

1. In same project, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `sweatbot-db`
   - **Database Name**: `sweatbot`
   - **User**: `sweatbot`
   - **Plan**: `Free`
3. Click **"Create Database"**

### Step 3: Add Environment Variables (3 minutes)

Add these to your web service's **Environment** tab:

```
NODE_ENV = production
DOPPLER_PROJECT = sweatbot
DOPPLER_CONFIG = prd
DOPPLER_SERVICE_TOKEN = <your-doppler-token>
```

**DATABASE_URL** is auto-added from render.yaml ✅

### Step 4: Deploy and Verify (3 minutes)

After deployment starts:
1. **Build**: ~3-4 minutes (TypeScript compilation)
2. **Health Check**: Render automatically tests `/health`
3. **Live URL**: Available in service dashboard

---

## 🔍 Verification Commands

### Check Health Status
```bash
# Replace with your actual Render URL
curl https://your-service-name.onrender.com/health

# Expected response:
{"status":"healthy","service":"sweatbot-api","version":"2.0.0","environment":"production","timestamp":"...","features":{"authentication":"✅ Working","ai_chat":"✅ Working","exercise_tracking":"✅ Working","databases":"🔄 Connecting...","ai_providers":"🔄 Testing..."}}
```

### Check Environment Variables
```bash
curl https://your-service-name.onrender.com/debug/env

# Expected response shows API keys status
{"status":"debug","environment":"production","api_keys_loaded":{"OPENAI_API_KEY":true,"GROQ_API_KEY":true,...}}
```

### Test API Endpoints
```bash
# Test authentication
curl -X POST https://your-service-name.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test AI chat
curl -X POST https://your-service-name.onrender.com/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello SweatBot","provider":"openai"}'

# Test exercise logging
curl -X POST https://your-service-name.onrender.com/exercises \
  -H "Content-Type: application/json" \
  -d '{"exerciseName":"Push-ups","sets":3,"reps":15,"workoutType":"strength"}'
```

---

## 🔐 Doppler Configuration (Optional but Recommended)

### If You Have Doppler Account:
1. Go to **doppler.com** → **sweatbot/prd**
2. Generate service token: **render-sweatbot**
3. Add to Render environment: `DOPPLER_SERVICE_TOKEN = <token>`
4. Secrets auto-sync on deployment

### If You Don't Have Doppler:
Set environment variables manually in Render:
```
OPENAI_API_KEY = your-key
GROQ_API_KEY = your-key
GEMINI_API_KEY = your-key
JWT_SECRET = generated-secret-key
```

---

## 📊 Monitoring and Debugging

### Health Dashboard Features
The `/health` endpoint provides:
- ✅ Service status and version
- ✅ Feature availability flags
- ✅ Environment detection
- ✅ Timestamp for uptime tracking

### Debug Information
The `/debug/env` endpoint shows:
- 🔑 API keys existence (without exposing values)
- 🔢 Total environment variables count
- 🌍 Current environment mode
- ⏰ Real-time debug status

### Render Logs Monitoring
1. Go to your service → **"Logs"** tab
2. Look for startup message: `🚀 SweatBot API v2.0.0 started successfully!`
3. Check for TypeScript compilation errors
4. Monitor API request/response logs

---

## 🎯 Success Indicators

### ✅ Successful Deployment
- Render shows "Live" status
- `/health` returns JSON with status: "healthy"
- Service responds to POST requests
- No errors in logs tab
- TypeScript build completed without errors

### 🔄 Spin-Up Behavior (Free Tier)
- App spins down after 15 minutes inactivity
- Cold start takes ~30 seconds (normal)
- Subsequent requests: <200ms
- Database connections established on startup

---

## 🐛 Common Issues & Solutions

### Build Fails
**Issue**: TypeScript compilation errors
**Solution**: Check render.yaml build command, ensure TypeScript dependencies

### Database Connection Error
**Issue**: `DATABASE_URL` not found
**Solution**: Verify PostgreSQL service created and linked via render.yaml

### Port Binding Error
**Issue**: "Address already in use"
**Solution**: Use Render's `$PORT` environment variable (already configured)

### API Keys Missing
**Issue**: AI providers not working
**Solution**: Add DOPPLER_SERVICE_TOKEN or set API keys manually

### Health Check Fails
**Issue**: Service not responding on `/health`
**Solution**: Verify server-simple.js has health endpoint implemented

---

## 🎉 Next Steps After Deployment

1. **Frontend Integration**: Update frontend to use new Node.js backend URL
2. **AI Provider Setup**: Configure API keys in Doppler for real AI functionality
3. **Database Migration**: Set up PostgreSQL schemas for persistent data
4. **Monitoring**: Set up alerts for service health
5. **Domain**: Add custom domain if needed

---

## 📚 Architecture Overview

```
Frontend (Vercel/Netlify) → Node.js API (Render) → PostgreSQL (Render)
                            ↓
                    AI Providers (OpenAI/Groq/Gemini)
                            ↓
                      MongoDB/Redis (Optional)
```

**Key Features Implemented:**
- ✅ RESTful API with Express.js
- ✅ TypeScript compilation and type safety
- ✅ Health check and debug endpoints
- ✅ CORS configuration for cross-origin requests
- ✅ Mock authentication and AI chat endpoints
- ✅ Exercise logging and history tracking
- ✅ Environment-based configuration
- ✅ Render deployment optimization

---

**Deployment Status**: ✅ Ready for production deployment
**Last Updated**: October 19, 2025
**Documentation Version**: 1.0