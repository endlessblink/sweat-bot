# Render Free Tier Deployment Guide

## Overview
Deploy SweatBot to Render's free tier for personal use - completely free with no credit card required.

## What You Get (Free Tier)
- ✅ **Web Service**: FastAPI backend (spins down after 15min inactivity)
- ✅ **PostgreSQL**: 256MB database
- ✅ **Custom Domain**: Free SSL included
- ✅ **Auto-deployment**: From GitHub
- ✅ **Health Checks**: Automatic monitoring

## Step 1: Prepare Your Repository

Your SweatBot project is already configured with:
- `render.yaml` - Render configuration file
- `requirements.txt` - Python dependencies
- `Procfile` - Process configuration

## Step 2: Deploy to Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub (free, no credit card)
3. Authorize Render to access your repositories

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Select your `sweatbot` repository
3. Configure:
   - **Name**: `sweatbot-api`
   - **Environment**: `Python 3`
   - **Branch**: `feature/points-system-v3-rebuild` (or `main`)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.3 Create Database
1. Click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `sweatbot-db`
   - **Database Name**: `sweatbot`
   - **User**: `sweatbot`
   - **Plan**: Free

### 2.4 Add Environment Variables
In your web service settings, add these environment variables:

```bash
DATABASE_URL=postgresql://sweatbot:password@host:5432/sweatbot
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key-here
DEBUG=false
```

## Step 3: Update Vercel Frontend

Once deployed, update `personal-ui-vite/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-app-name.onrender.com/api/:path*"
    },
    {
      "source": "/ws",
      "destination": "https://your-app-name.onrender.com/ws"
    },
    {
      "source": "/health/:path*",
      "destination": "https://your-app-name.onrender.com/health/:path*"
    },
    {
      "source": "/auth/:path*",
      "destination": "https://your-app-name.onrender.com/auth/:path*"
    }
  ]
}
```

## Step 4: Test Deployment

1. **Backend**: Visit `https://your-app-name.onrender.com/health`
2. **Frontend**: Visit your Vercel frontend URL
3. **WebSocket**: Test voice transcription features

## Spin-Down Behavior (Free Tier)

**What happens:**
- App spins down after 15 minutes of inactivity
- Takes ~30 seconds to wake up when accessed
- This is perfect for personal development!

**To keep it active during development:**
- Make periodic requests to `/health`
- Or upgrade to $7/month Starter plan when needed

## Costs

**Free Tier**: $0/month
- Perfect for personal use and development

**When to upgrade** ($7/month):
- You want always-on availability
- Multiple users accessing the app
- Production deployment

## Troubleshooting

### Common Issues:
1. **Build failures**: Check `requirements.txt` versions
2. **Database connection**: Verify `DATABASE_URL` format
3. **WebSocket issues**: Ensure CORS headers are set correctly
4. **Spin-down delays**: First request after inactivity takes 30 seconds

### Getting Help:
- Render logs: Check your service logs in Render dashboard
- GitHub issues: Render automatically shows build failures
- Database connection: Use external connection string from Render

## Next Steps

1. Deploy to Render using this guide
2. Test all features work correctly
3. Update Vercel configuration with Render URL
4. Enjoy your free personal SweatBot deployment!