# 🚀 SweatBot Cloudflare Tunnel Setup Guide

Your complete guide to deploying SweatBot at **sweat-bot.com** using Cloudflare Tunnel.

---

## ✅ Completed Steps

- [x] Domain purchased: **sweat-bot.com** (via Cloudflare Registrar)
- [x] Cloudflared installed (version 2025.7.0)
- [x] Tunnel created: **sweatbot-production** (ID: 550392e0-a3ff-4149-87e5-3f6461c4a001)
- [x] Backend CORS updated for sweat-bot.com
- [x] Frontend production environment configured

---

## 📋 Next Steps (Do This Now)

### Step 1: Configure Tunnel in Cloudflare Dashboard

1. **Open Cloudflare Zero Trust Dashboard**
   - Go to: https://one.dash.cloudflare.com/
   - Navigate to: **Networks → Tunnels**
   - Click on: **sweatbot-production**

2. **Add Frontend Public Hostname**
   - Click **"Public Hostnames"** tab
   - Click **"Add a public hostname"**
   - Configure:
     ```
     Subdomain: [leave empty]
     Domain: sweat-bot.com
     Path: [leave empty]
     Type: HTTP
     URL: localhost:8005
     ```
   - Click **"Save hostname"**

3. **Add Backend API Public Hostname**
   - Click **"Add a public hostname"** again
   - Configure:
     ```
     Subdomain: api
     Domain: sweat-bot.com
     Path: [leave empty]
     Type: HTTP
     URL: localhost:8000
     ```
   - Click **"Save hostname"**

### Step 2: Install Connector

After configuring hostnames, you'll see an **"Install and run a connector"** section.

1. **Copy the installation command** (looks like):
   ```bash
   cloudflared service install eyJhIjoiXXXXXXXX...
   ```

2. **Run it in your WSL2 terminal**:
   ```bash
   cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot

   # Paste the command from Cloudflare dashboard
   cloudflared service install <your-token-here>
   ```

3. **Enable auto-start**:
   ```bash
   sudo systemctl enable cloudflared
   sudo systemctl start cloudflared
   ```

4. **Verify tunnel is running**:
   ```bash
   sudo systemctl status cloudflared

   # Should show: "active (running)"
   ```

---

## 🚀 Start SweatBot Services

### Terminal 1: Docker (Databases)
```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/config/docker
doppler run -- docker-compose up -d

# Verify containers
docker ps
```

### Terminal 2: Backend (FastAPI)
```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/backend
doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 3: Frontend (Vite)
```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/personal-ui-vite
doppler run -- npm run dev -- --mode production
```

### Terminal 4: Cloudflare Tunnel (if not using systemd)
```bash
cloudflared tunnel run sweatbot-production
```

---

## 🧪 Test Your Deployment

### 1. Check Tunnel Health
Go to: https://one.dash.cloudflare.com/ → **Networks → Tunnels**

Status should show: **"Healthy"** ✅

### 2. Test Frontend
Open: **https://sweat-bot.com**

Expected:
- SweatBot app loads
- No CORS errors in DevTools console
- Login/signup works

### 3. Test Backend API
Open: **https://api.sweat-bot.com/health**

Expected JSON response:
```json
{
  "status": "healthy",
  "service": "sweatbot-api",
  "version": "1.0.0",
  "database": "connected"
}
```

### 4. Test PWA on Mobile

**iOS (Safari):**
1. Open https://sweat-bot.com on iPhone
2. Tap **Share** → **"Add to Home Screen"**
3. Verify SweatBot icon appears
4. Open from home screen (should be standalone)

**Android (Chrome):**
1. Open https://sweat-bot.com on Android
2. Tap **"Install app"** banner
3. Verify installation
4. Test Hebrew RTL layout

---

## 📝 Production Configuration Summary

### Domain Structure
```
https://sweat-bot.com          → Frontend (Vite, port 8005)
https://api.sweat-bot.com      → Backend (FastAPI, port 8000)
```

### CORS Configuration
**Backend** (`backend/app/core/config.py`):
```python
CORS_ORIGINS_STR = "...https://sweat-bot.com"
```

**TrustedHost** (`backend/app/main.py`):
```python
allowed_hosts = ["sweat-bot.com", "*.sweat-bot.com"]
```

### Frontend Environment
**File**: `personal-ui-vite/.env.production`
```env
VITE_BACKEND_URL=https://api.sweat-bot.com
VITE_FRONTEND_URL=https://sweat-bot.com
VITE_ENV=production
```

---

## 🔧 Troubleshooting

### Issue: Tunnel shows "Unhealthy"
**Solution:**
```bash
# Restart cloudflared service
sudo systemctl restart cloudflared

# Check logs
sudo journalctl -u cloudflared -f
```

### Issue: "Bad Gateway" (502)
**Causes:**
- Backend not running on port 8000
- Frontend not running on port 8005

**Solution:**
```bash
# Check services are running
lsof -i :8000  # Backend
lsof -i :8005  # Frontend

# Test locally
curl http://localhost:8000/health
curl http://localhost:8005
```

### Issue: CORS Errors
**Solution:**
1. Verify backend is using production config
2. Check `CORS_ORIGINS_STR` includes `https://sweat-bot.com`
3. Restart backend after changes

### Issue: PWA Not Installing
**Possible Causes:**
- HTTPS not working (check Cloudflare dashboard)
- Manifest not accessible (test: https://sweat-bot.com/manifest.webmanifest)
- Service worker errors (check browser DevTools)

**Solution:**
```bash
# Test manifest
curl https://sweat-bot.com/manifest.webmanifest

# Check for errors in browser console
# Mobile Chrome: chrome://inspect
```

---

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  Mobile Device (iOS/Android)                        │
│  ├─ SweatBot PWA Icon                               │
│  └─ Offline Service Worker                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS (Cloudflare SSL)
                  │
┌─────────────────▼───────────────────────────────────┐
│  Cloudflare Edge Network                            │
│  ├─ sweat-bot.com → Tunnel → localhost:8005         │
│  └─ api.sweat-bot.com → Tunnel → localhost:8000     │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Encrypted Tunnel (outbound only)
                  │
┌─────────────────▼───────────────────────────────────┐
│  WSL2 Ubuntu (Dev Machine)                          │
│  ├─ cloudflared (systemd service)                   │
│  ├─ Backend (FastAPI) → :8000                       │
│  ├─ Frontend (Vite) → :8005                         │
│  └─ Databases (Docker)                              │
│     ├─ PostgreSQL → :8001                           │
│     ├─ MongoDB → :8002                              │
│     └─ Redis → :8003                                │
└─────────────────────────────────────────────────────┘
```

---

## 💰 Cost Breakdown

| Item | Annual Cost | Notes |
|------|-------------|-------|
| Domain (sweat-bot.com) | ~$10-15 | Cloudflare Registrar |
| Cloudflare Tunnel | **FREE** | Unlimited usage |
| SSL Certificate | **FREE** | Auto-provisioned |
| WHOIS Privacy | **FREE** | Included |
| **Total** | **~$10-15** | Just domain cost |

---

## 📚 Additional Resources

- [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [PWA Installation Guide](https://web.dev/customize-install/)
- [SweatBot Full Documentation](./docs/CLOUDFLARE-TUNNEL-SETUP.md)

---

## ✅ Success Checklist

- [ ] Tunnel configured in Cloudflare dashboard
- [ ] Public hostnames added (frontend + API)
- [ ] Connector installed and running
- [ ] Services started (Docker, Backend, Frontend)
- [ ] Frontend loads at https://sweat-bot.com
- [ ] API responds at https://api.sweat-bot.com/health
- [ ] PWA installs on mobile (iOS tested)
- [ ] PWA installs on mobile (Android tested)
- [ ] Hebrew text displays correctly (RTL)
- [ ] Exercise logging works end-to-end

---

**🎉 Once complete, SweatBot will be live at https://sweat-bot.com!**

Need help? Check the troubleshooting section above or refer to the full documentation in `docs/CLOUDFLARE-TUNNEL-SETUP.md`.
