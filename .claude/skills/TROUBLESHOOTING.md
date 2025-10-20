# 🐛 SweatBot Render Deployment - Troubleshooting Guide

**Purpose**: Diagnose and fix common deployment issues

**How to Use**: Find your error message, follow the solution, test with health check

---

## 🔍 Quick Diagnosis

### Step 1: Check Service Status
1. Go to Render dashboard
2. Find your service
3. Check status indicator:
   - 🟢 Green = Running (working!)
   - 🔵 Blue = Building (wait 5-10 min)
   - 🟠 Orange = Suspended (upgrade plan)
   - 🔴 Red = Failed (see logs)

### Step 2: Check Logs
1. Click on service
2. Click **"Logs"** tab
3. Scroll to find error messages
4. Note the error type

### Step 3: Find Error Below
Use error type to navigate to solution

---

## 🚨 Common Errors & Solutions

### ❌ Error: "Build Failed - ModuleNotFoundError"

**Message**: `ModuleNotFoundError: No module named 'fastapi'`

**Cause**: Dependency missing from `requirements.txt`

**Fix**:
1. Check `requirements.txt` has the module:
   ```bash
   grep fastapi backend/requirements.txt
   # Should show: fastapi==0.104.1
   ```

2. If missing, add it:
   ```bash
   echo "fastapi==0.104.1" >> backend/requirements.txt
   ```

3. Push to GitHub:
   ```bash
   git add backend/requirements.txt
   git commit -m "Add missing fastapi dependency"
   git push origin main
   ```

4. Render auto-redeploys

**Test**: 
```bash
curl https://your-service-name.onrender.com/health
```

---

### ❌ Error: "502 Bad Gateway"

**Message**: Browser shows `502 Bad Gateway`

**Most Common Cause**: Doppler service token is missing or invalid

**Fix**:
1. Go to Render service → **Environment** tab
2. Check if `DOPPLER_SERVICE_TOKEN` exists:
   - If missing: Add it from Doppler dashboard
   - If wrong value: Update with correct token
3. Save (auto-redeploys)
4. Check logs for: `Doppler authentication failed`

**Alternative Cause**: App crashes on startup

**Fix**:
1. Check logs for Python errors
2. Look for: `Exception`, `Error`, `Traceback`
3. Common: Database connection, missing config
4. Fix the error in code, push, redeploy

**Test**:
```bash
curl https://your-service-name.onrender.com/health
```

---

### ❌ Error: "Database connection refused"

**Message**: `psycopg2.OperationalError: could not connect to server`

**Cause**: Database URL format or database not running

**Fix - Check Database Status**:
1. Go to Render dashboard
2. Find `sweatbot-db` PostgreSQL service
3. Check status:
   - If 🔴 Red: Database failed, click to see error
   - If 🟢 Green: Continue to next fix

**Fix - Check Connection String**:
1. Go to PostgreSQL service → **Info** tab
2. Copy "Internal Database URL"
3. Go to web service → **Environment**
4. Update `DATABASE_URL` with the correct URL
5. Save

**Fix - Check Credentials**:
1. Verify database user/password are correct:
   ```
   postgresql://sweatbot:password@host:5432/sweatbot
   ```
2. In render.yaml, verify:
   ```yaml
   user: sweatbot  # Must match
   databaseName: sweatbot
   ```

**Test**:
```bash
# From your local machine with correct DATABASE_URL
psql postgresql://sweatbot:password@host:5432/sweatbot -c "SELECT 1"
```

---

### ❌ Error: "Out of Memory"

**Message**: `MemoryError` or `Killed` in logs

**Cause**: Free tier only has 0.5 GB RAM, dependencies too large

**Fix - Optimize Dependencies**:
1. Check `requirements.txt` for heavy packages:
   - `torch` (full) = 2+ GB ❌
   - `torch-cpu` = Much smaller ✅
   - `tensorflow` = Very large ❌

2. Use CPU-only versions (already configured):
   ```
   torch==2.1.1  # Current config uses CPU-only
   ```

3. Remove unused packages:
   ```bash
   # Review and remove unused from requirements.txt
   git add backend/requirements.txt
   git commit -m "Remove unused dependencies"
   git push origin main
   ```

**Fix - Upgrade Plan**:
- Free tier: 0.5 GB (limited)
- Starter: 1 GB ($7/month)
- Standard: 2 GB ($12/month)

Upgrade if dependencies are essential and can't be optimized.

---

### ❌ Error: "Build timeout (15 minutes)"

**Message**: `Build duration exceeded limit`

**Cause**: Dependencies taking too long to install

**Fix - Optimize Build**:
1. Current render.yaml optimizes build:
   ```yaml
   buildCommand: "pip install --upgrade pip setuptools wheel && pip install --no-cache-dir -r requirements.txt"
   ```

2. This should be ~3-4 minutes

3. If still slow, remove unnecessary packages:
   ```bash
   # Remove heavy packages not actively used
   # Rebuild and redeploy
   ```

4. Check for network issues:
   - Sometimes pip repository is slow
   - Render automatically retries
   - If persists, try different pip index

---

### ❌ Error: "WebSocket connection failed"

**Message**: Browser console: `WebSocket connection failed to...`

**Cause**: HTTPS/WSS protocol mismatch or CORS issue

**Fix - Check WebSocket Endpoint**:
1. Frontend should connect to WSS (not WS):
   ```javascript
   // ❌ Wrong
   ws = new WebSocket('http://your-service.onrender.com/ws');
   
   // ✅ Correct
   ws = new WebSocket('wss://your-service.onrender.com/ws');
   ```

2. Update frontend code to use WSS

3. Deploy frontend

**Fix - Check CORS Headers**:
1. Backend should accept requests from frontend domain:
   ```python
   # In backend/app/main.py
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["https://your-frontend.vercel.app"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

2. Update with your Vercel domain

3. Push and redeploy

**Test**:
```javascript
// In browser console
ws = new WebSocket('wss://your-service.onrender.com/ws');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.log('Error:', e);
```

---

### ❌ Error: "Cold start taking 30 seconds"

**Message**: First request after inactivity takes ~30 seconds

**Cause**: Free tier spins down after 15 min inactivity

**This is normal!** ✅

**Fix - Keep Service Running**:
1. **Option A**: Upgrade to Starter ($7/month) - always on
2. **Option B**: Set up keep-alive script
   ```bash
   # Call health endpoint every 10 minutes
   watch -n 600 'curl https://your-service.onrender.com/health'
   ```
3. **Option C**: Accept the 30-second delay for personal use

---

### ❌ Error: "Deployment canceled by user"

**Message**: Deploy shows as canceled

**Cause**: Manual cancel or syntax error in render.yaml

**Fix**:
1. Check `render.yaml` syntax:
   ```yaml
   # Should have proper indentation
   # All values properly quoted
   ```

2. Use YAML validator: https://www.yamllint.com/

3. Fix errors, push, redeploy:
   ```bash
   git add render.yaml
   git commit -m "Fix render.yaml syntax"
   git push origin main
   ```

---

### ❌ Error: "Port already in use"

**Message**: `Address already in use` on port 10000

**Cause**: Previous process still running, or wrong port

**Fix**:
1. Your app should use `$PORT` environment variable:
   ```python
   # In backend/app/main.py
   import os
   port = int(os.getenv('PORT', 8000))
   ```

2. Start command must be:
   ```
   uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
   ```

3. This is already in render.yaml ✅

4. If error persists:
   - Check logs for detailed error
   - Kill any stuck processes
   - Redeploy

---

## ✅ Verification Checklist

After fixing any issue, verify with these commands:

```bash
# 1. Check service is running
curl https://your-service-name.onrender.com/health
# Expected: {"status": "ok"} or {"status": "ok", "database": "connected"}

# 2. Check API works
curl -X GET https://your-service-name.onrender.com/api/status

# 3. Check database connected
curl -X GET https://your-service-name.onrender.com/api/db-check

# 4. Check WebSocket (in browser console)
ws = new WebSocket('wss://your-service.onrender.com/ws');
ws.onopen = () => console.log('✅ Connected!');
```

---

## 🔍 Advanced Debugging

### Enable Debug Logging

1. Go to Render service → **Environment**
2. Add: `DEBUG = true`
3. Save (redeploys)
4. More verbose logs appear in Logs tab

### Check Build Logs

1. Go to service
2. Click **"Deployments"** tab
3. Find the failed deployment
4. Click to see full build output
5. Look for first error

### SSH Into Service (Paid Plans Only)

Not available on free tier, but logs are usually sufficient.

---

## 🆘 Still Stuck?

1. **Check Render Status**: https://status.render.com/
2. **Read Render Docs**: https://render.com/docs
3. **Check GitHub Issues**: Search `sweatbot` issues
4. **Review Logs Again**: 99% of issues are in the logs

---

## 📚 Related Guides

- [QUICK_START.md](QUICK_START.md) - Deploy in 5 minutes
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Full reference
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Secrets setup
