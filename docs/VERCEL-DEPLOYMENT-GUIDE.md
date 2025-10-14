# SweatBot Vercel Deployment Guide

## Overview
This guide covers deploying the SweatBot frontend to Vercel while keeping the backend running locally for development and testing.

## Architecture
```
Mobile Device → Vercel Frontend (HTTPS) → Local Backend (HTTP)
     ↓                    ↓                      ↓
Microphone ✅        CORS Fixed ✅         Doppler Secrets ✅
Recording ✅          HTTPS ✅              Database ✅
```

## Files Created/Modified

### 1. Vercel Configuration (`vercel.json`)
- Configures build settings for Vite + React
- Sets up API rewrites to proxy backend calls to localhost:8000
- Handles SPA routing
- Defines environment variables

### 2. Production Environment (`.env.production`)
- Empty VITE_API_URL and VITE_BACKEND_URL (will be set via Vercel env vars)
- Maintains same STT configuration as development

### 3. Backend CORS Update (`backend/app/core/config.py`)
- Added `https://sweat-bot.vercel.app` to allowed origins
- Enables cross-origin requests from Vercel to local backend

## Deployment Steps

### Prerequisites
1. **Vercel Account**: Sign up at https://vercel.com (free tier)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Local Backend**: Backend running with Doppler on port 8000

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy Frontend
```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/personal-ui-vite
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel
1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables:
   ```
   VITE_API_URL=https://sweat-bot.vercel.app
   VITE_BACKEND_URL=https://sweat-bot.vercel.app
   ```

### Step 5: Test the Deployment
1. Open `https://sweat-bot.vercel.app` in your browser
2. Test on mobile device:
   - Microphone permission should work (HTTPS requirement solved)
   - Try voice recording in Hebrew
   - Check browser console for any errors

## API Proxy Configuration

The `vercel.json` file configures these rewrites:
- `/api/*` → `http://localhost:8000/api/*` (for local development)
- `/ws` → `http://localhost:8000/ws` (WebSocket support)
- `/health/*` → `http://localhost:8000/health/*` (health checks)

## Testing Mobile Voice Transcription

### What Should Work Immediately:
✅ **Microphone Permission** - HTTPS allows mobile browsers to grant access
✅ **CORS Issues** - Proper domain instead of localhost
✅ **UI Loading** - Stable HTTPS connection

### What Still Needs Debugging:
❌ **Empty Audio Blobs** - Mobile MediaRecorder issues
❌ **Audio Processing** - Hebrew STT integration
❌ **FormData Handling** - Mobile browser quirks

### Debugging Steps:
1. **Open Developer Tools** on mobile (if possible) or use Chrome DevTools remote debugging
2. **Check Console** for microphone permission errors
3. **Monitor Network** tab for failed API calls
4. **Test Audio Recording** using the `/audio-test` page

## Troubleshooting

### "Microphone access denied"
- **Cause**: HTTPS requirement not met
- **Fix**: Ensure you're accessing via HTTPS URL, not HTTP

### "CORS policy error"
- **Cause**: Vercel domain not in backend CORS origins
- **Fix**: Restart backend after updating CORS configuration

### "API calls failing"
- **Cause**: Local backend not running or not accessible
- **Fix**: Ensure backend is running on port 8000 with Doppler

### "Audio transcription not working"
- **Cause**: Mobile MediaRecorder creating empty blobs
- **Fix**: Check the enhanced logging we added earlier

## Next Steps

### Phase 1: Initial Deployment ✅
- Deploy frontend to Vercel
- Test mobile microphone access
- Verify API connectivity

### Phase 2: Mobile Audio Debugging (Current)
- Debug MediaRecorder issues on HTTPS
- Fix empty audio blob problems
- Test Hebrew transcription

### Phase 3: Full Cloud Migration (Future)
- Deploy backend to Railway
- Set up Neon PostgreSQL
- Configure production environment

## Environment Variables

### Development (`.env`)
```
VITE_API_URL=http://localhost:8000
VITE_BACKEND_URL=http://localhost:8000
```

### Production (Vercel Dashboard)
```
VITE_API_URL=https://sweat-bot.vercel.app
VITE_BACKEND_URL=https://sweat-bot.vercel.app
```

## Benefits of This Approach

1. **Immediate Mobile Testing** - HTTPS solves microphone access
2. **Stable Environment** - No more Cloudflare tunnel issues
3. **Incremental Migration** - Keep local development advantages
4. **Free Hosting** - Vercel free tier covers this use case
5. **Easy Rollback** - Can quickly revert to local-only if needed

## Commands Summary

```bash
# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View deployment logs
vercel logs sweat-bot-frontend

# Redeploy after changes
git push origin main  # Auto-triggers Vercel deployment
```

---

*This hybrid approach gives us immediate mobile testing capability while maintaining development flexibility. Once mobile audio recording is working properly, we can migrate the backend to cloud providers like Railway for full production deployment.*