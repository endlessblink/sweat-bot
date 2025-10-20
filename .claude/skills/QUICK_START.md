# 🚀 SweatBot Render Deployment - Quick Start (5 Minutes)

## Prerequisites Checklist
- ✅ GitHub account with sweatbot repository pushed
- ✅ Render account (free signup at render.com)
- ✅ Internet connection
- ✅ This file

**Estimated Time**: 5-10 minutes

---

## Step 1: Create Render Account (1 minute)

1. Go to **https://render.com**
2. Click **"Sign Up"**
3. Select **"Continue with GitHub"**
4. Authorize Render to access your repositories
5. Verify email

Done! ✅

---

## Step 2: Deploy Backend Web Service (2 minutes)

1. From Render dashboard, click **"New +"** → **"Web Service"**
2. Select your **sweatbot** repository
3. Configure:
   - **Name**: `sweatbot-api` (or choose your own)
   - **Environment**: `Python 3`
   - **Branch**: `main` (or your deployment branch)
   - **Root Directory**: Leave empty (Render auto-detects)
   - **Build Command**: Leave blank (render.yaml defines it)
   - **Start Command**: Leave blank (render.yaml defines it)
   - **Plan**: `Free` ← Important!

4. Click **"Deploy Web Service"**

Status will show "Building..." 🔨

---

## Step 3: Create PostgreSQL Database (2 minutes)

While backend builds, create the database:

1. From Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `sweatbot-db`
   - **Database Name**: `sweatbot`
   - **User**: `sweatbot`
   - **Plan**: `Free` ← Important!
   - **Region**: Same as your web service

3. Click **"Create Database"**

Status will show "Provisioning..." 🔨

Note your connection string (format: `postgresql://user:pass@host:5432/db`)

---

## Step 4: Add Environment Variables (1 minute)

### For Web Service:

1. Go to your web service in Render dashboard
2. Click **"Environment"** tab
3. Add these variables:

```
DOPPLER_PROJECT = sweatbot
DOPPLER_CONFIG = prd
DEBUG = false
PYTHON_VERSION = 3.11.9
```

4. Click **"Save"**

Note: `DATABASE_URL` is auto-added from render.yaml

---

## Step 5: Add Doppler Service Token (1 minute)

### Get Doppler Token:

1. If you have Doppler account:
   - Go to doppler.com
   - Project: sweatbot
   - Config: prd
   - Copy the **Service Token**

2. Add to Render environment:
   - Go to web service → Environment
   - Add: `DOPPLER_SERVICE_TOKEN = <your-token>`
   - Click Save

If you don't have Doppler, see [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md)

---

## Step 6: Verify Deployment ✅

### After ~10-15 minutes, check if live:

```bash
# Replace YOUR-SERVICE-NAME with your Render service name
curl https://your-service-name.onrender.com/health

# Expected response:
# {"status": "ok", "database": "connected"}
```

If you get a response, deployment succeeded! 🎉

---

## 🔗 Your Live URLs

After successful deployment:

- **Backend API**: `https://your-service-name.onrender.com`
- **Health Check**: `https://your-service-name.onrender.com/health`
- **API Docs**: `https://your-service-name.onrender.com/docs`

---

## ⚡ Important Notes

### Spin-Down Behavior (Free Tier)
- App automatically spins down after 15 minutes of no requests
- First request after spin-down takes ~30 seconds
- This is normal and expected on free tier

### Keep It Running
Option A: Upgrade to Starter plan ($7/month)
Option B: Make periodic requests (keep-alive script)
Option C: Accept the 30-second cold start

### Free Tier Limits
- ✅ 0.5 GB RAM
- ✅ Shared CPU
- ✅ 256 MB database
- ✅ Auto-pause after 15 min inactivity
- ✅ Limited to one free web service + one free database

---

## 🐛 If Something Goes Wrong

### Check Logs:
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. Scroll to find errors
4. Common errors:
   - `ModuleNotFoundError`: Missing dependency in requirements.txt
   - `ProgrammingError`: Database connection issue
   - `CORS error`: Frontend configuration issue

### See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed fixes

---

## 🎉 Success Indicators

- ✅ Deploy log shows "Your service is live"
- ✅ `curl /health` returns 200 OK
- ✅ Can see service in Render dashboard
- ✅ Database shows "Available" status
- ✅ No errors in Logs tab

---

## 📞 Next Steps

1. **Frontend Integration**: Connect your Vercel frontend
2. **Testing**: Run full e2e tests against live API
3. **Monitoring**: Set up alerts for crashes
4. **Production**: Consider upgrading plan for critical features

---

## 📚 Full Documentation

For detailed guides, see:
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Complete reference
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Secrets management
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix common issues
