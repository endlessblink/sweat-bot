# Cloudflare Tunnel Setup Guide for SweatBot

Complete guide to deploying SweatBot as a PWA using Cloudflare Tunnel with a custom domain.

## Prerequisites

- ✅ Cloudflared installed (version 2025.7.0+)
- ✅ PWA icons and manifest configured
- ⏳ Custom domain (to be purchased)
- ⏳ Cloudflare account with domain added

---

## Phase 1: Domain Purchase

### Recommended: Cloudflare Registrar

**Why Cloudflare?**
- At-cost pricing (~$9.77/year for .com, no markup)
- Free WHOIS privacy
- Automatic SSL/HTTPS
- Zero configuration with Cloudflare Tunnel
- No renewal price increases

### Domain Name Options (Priority Order)

1. **`sweatbot.app`** - Modern, fitness-focused TLD
2. **`sweatbot.fitness`** - Industry-specific
3. **`sweatbot.co.il`** - Israeli market (Hebrew speakers)
4. **`sweatbot.com`** - Traditional, universally recognized
5. **`hebrewfitness.app`** - Alternative brand

### Purchase Steps

1. Go to https://domains.cloudflare.com/
2. Search for your preferred domain name
3. Click "Purchase" (cost displayed is final - no hidden fees)
4. Complete payment
5. Domain automatically added to your Cloudflare account
6. **Wait 5-10 minutes** for DNS propagation

---

## Phase 2: Create Cloudflare Tunnel

### Step 1: Access Cloudflare Zero Trust Dashboard

1. Log in to https://one.dash.cloudflare.com/
2. Navigate to **Networks → Tunnels**
3. Click **"Create a tunnel"**
4. Select **"Cloudflared"** as connector type
5. Name the tunnel: `sweatbot-production`
6. Click **"Save tunnel"**

### Step 2: Install Connector (WSL2)

Cloudflare will display an installation command like:

```bash
cloudflared service install <your-unique-token>
```

**Copy and run this command in WSL2.** This authenticates your tunnel and creates credentials.

### Step 3: Verify Installation

```bash
# Check tunnel status
cloudflared tunnel list

# You should see:
# ID                              NAME                   CREATED
# <tunnel-id>                     sweatbot-production    <timestamp>
```

---

## Phase 3: Configure Public Hostnames

In the Cloudflare dashboard, after creating the tunnel:

### Frontend Configuration

1. Click **"Add a public hostname"**
2. Configure as follows:
   - **Subdomain**: (leave empty for root domain)
   - **Domain**: `sweatbot.app` (or your purchased domain)
   - **Path**: (leave empty)
   - **Service Type**: `HTTP`
   - **URL**: `localhost:8005`
3. Click **"Save hostname"**

### Backend API Configuration

1. Click **"Add a public hostname"** again
2. Configure as follows:
   - **Subdomain**: `api`
   - **Domain**: `sweatbot.app`
   - **Path**: (leave empty)
   - **Service Type**: `HTTP`
   - **URL**: `localhost:8000`
3. Click **"Save hostname"**

### Result

Your tunnel will now route:
- `https://sweatbot.app` → `http://localhost:8005` (Frontend)
- `https://api.sweatbot.app` → `http://localhost:8000` (Backend)

**SSL/HTTPS is automatic** - Cloudflare handles certificates.

---

## Phase 4: Update SweatBot Configuration

### Backend CORS Settings

Add your production domain to allowed origins in Doppler or `.env`:

```bash
CORS_ORIGINS='["https://sweatbot.app", "http://localhost:8005"]'
```

Or update `backend/app/main.py` directly:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://sweatbot.app",      # Production
        "http://localhost:8005",      # Local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Frontend API Configuration

Update `personal-ui-vite/src/config.ts`:

```typescript
export const API_BASE_URL = import.meta.env.PROD
  ? 'https://api.sweatbot.app'  // Production via Cloudflare Tunnel
  : 'http://localhost:8000'      // Local development
```

Or use environment variables in `.env`:

```bash
VITE_API_BASE_URL=https://api.sweatbot.app
```

---

## Phase 5: Start Services

### Terminal 1: Docker Services (Databases)

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/config/docker
doppler run -- docker-compose up -d

# Verify containers are healthy
docker ps
```

### Terminal 2: Backend (FastAPI)

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/backend
doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 3: Frontend (Vite + React)

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/personal-ui-vite
doppler run -- npm run dev
```

### Terminal 4: Cloudflare Tunnel

```bash
cloudflared tunnel run sweatbot-production
```

**Expected output:**

```
INF Starting tunnel tunnelID=<id>
INF Connection registered connIndex=0
INF Each HA connection's tunnel IDs: map[0:<id>]
```

---

## Phase 6: Test Your Deployment

### Desktop Browser Testing

1. Open `https://sweatbot.app` in Chrome/Firefox
2. Verify the app loads with no CORS errors
3. Test login and exercise logging
4. Check DevTools → Network tab for `api.sweatbot.app` requests

### Mobile PWA Testing

#### iOS (Safari)

1. Open Safari on iPhone/iPad
2. Navigate to `https://sweatbot.app`
3. Tap **Share** button → **"Add to Home Screen"**
4. Verify:
   - SweatBot icon appears correctly
   - App name shows as "SweatBot"
   - Opens in standalone mode (no Safari UI)
5. Test offline mode:
   - Enable Airplane Mode
   - Open SweatBot from home screen
   - Verify cached pages load

#### Android (Chrome)

1. Open Chrome on Android device
2. Navigate to `https://sweatbot.app`
3. Tap **"Install app"** banner (or Menu → "Add to Home Screen")
4. Verify:
   - Installation prompt shows SweatBot icon
   - App installs as standalone app
   - Hebrew RTL layout works correctly
5. Test app drawer integration

---

## Phase 7: Production Setup (Auto-Start)

### Configure Systemd Service

```bash
# Install cloudflared as a system service
sudo cloudflared service install

# Enable auto-start on boot
sudo systemctl enable cloudflared

# Start the service
sudo systemctl start cloudflared

# Check status
sudo systemctl status cloudflared
```

### Verify Tunnel Health

1. Go to Cloudflare dashboard → **Networks → Tunnels**
2. Find `sweatbot-production`
3. Status should show **"Healthy"** with a green indicator
4. Click tunnel name to see traffic metrics

### Set Up Monitoring (Optional)

Create a health check script:

```bash
#!/bin/bash
# /home/endlessblink/bin/check-tunnel.sh

if ! systemctl is-active --quiet cloudflared; then
    echo "Cloudflared is down! Restarting..."
    sudo systemctl restart cloudflared
    # Send notification (optional)
    notify-send "SweatBot Tunnel" "Cloudflared restarted"
fi
```

Add to crontab to run every 5 minutes:

```bash
crontab -e
# Add:
*/5 * * * * /home/endlessblink/bin/check-tunnel.sh
```

---

## Troubleshooting

### Issue: "Bad Gateway" (502 Error)

**Causes:**
- Backend not running on `localhost:8000`
- Frontend not running on `localhost:8005`
- Services bound to `127.0.0.1` instead of `0.0.0.0`

**Solutions:**
```bash
# Check services are running
lsof -i :8000  # Backend should be here
lsof -i :8005  # Frontend should be here

# Verify services are listening on correct ports
curl http://localhost:8000/health
curl http://localhost:8005
```

### Issue: PWA Not Installing on Mobile

**Causes:**
- HTTPS not working (Cloudflare Tunnel should handle this automatically)
- manifest.webmanifest not accessible
- Missing required PWA meta tags

**Solutions:**
```bash
# Test manifest accessibility
curl https://sweatbot.app/manifest.webmanifest

# Check DevTools on mobile (Chrome)
# Open: chrome://inspect
# Look for PWA installation errors
```

### Issue: CORS Errors

**Symptoms:**
- Browser console shows: `Access-Control-Allow-Origin` errors
- API requests fail with CORS policy errors

**Solutions:**
1. Verify `CORS_ORIGINS` includes your production domain
2. Check backend logs for CORS-related errors
3. Ensure `allow_credentials=True` is set

### Issue: Tunnel Shows "Unhealthy"

**Causes:**
- Cloudflared service stopped
- Network connectivity issues
- Invalid credentials

**Solutions:**
```bash
# Restart cloudflared
sudo systemctl restart cloudflared

# Check logs
sudo journalctl -u cloudflared -f

# Re-authenticate tunnel (if credentials expired)
cloudflared tunnel login
```

### Issue: Domain Not Resolving

**Causes:**
- DNS propagation delay (can take up to 48 hours, usually 5-10 minutes)
- Nameservers not updated to Cloudflare

**Solutions:**
```bash
# Check DNS propagation
dig sweatbot.app

# Verify nameservers
dig sweatbot.app NS

# Should show Cloudflare nameservers:
# <domain>.ns.cloudflare.com
```

---

## Cost Breakdown

| Item | Cost | Notes |
|------|------|-------|
| Domain Registration | $9-15/year | Cloudflare Registrar at-cost pricing |
| Cloudflare Tunnel | **FREE** | No usage limits for this use case |
| SSL Certificate | **FREE** | Auto-provisioned by Cloudflare |
| WHOIS Privacy | **FREE** | Included with Cloudflare domains |
| **Total Annual Cost** | **$9-15/year** | Just the domain registration |

---

## Security Considerations

### Cloudflare Access (Optional)

For private deployment, you can add Cloudflare Access authentication:

1. Go to **Access → Applications**
2. Click **"Add an application"** → **"Self-hosted"**
3. Configure authentication (Google, GitHub, Email OTP, etc.)
4. Set access policies (who can access the app)

**Note:** PWA installation may not work properly with Cloudflare Access enabled on mobile. For public PWA deployment, keep the tunnel public.

### Rate Limiting (Recommended)

Configure rate limiting in Cloudflare dashboard:

1. Go to **Security → WAF → Rate limiting rules**
2. Create rule:
   - **Name**: `api-rate-limit`
   - **URL**: `api.sweatbot.app/*`
   - **Requests**: 100 per minute per IP
   - **Action**: Block or challenge

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│  Mobile Device (iOS/Android)                        │
│  ├─ PWA Icon on Home Screen                         │
│  └─ Offline Service Worker                          │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS (Cloudflare SSL)
                  │
┌─────────────────▼───────────────────────────────────┐
│  Cloudflare Edge Network                            │
│  ├─ sweatbot.app → Tunnel → localhost:8005          │
│  └─ api.sweatbot.app → Tunnel → localhost:8000      │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Cloudflare Tunnel (encrypted)
                  │
┌─────────────────▼───────────────────────────────────┐
│  WSL2 Ubuntu (Your Dev Machine)                     │
│  ├─ cloudflared (systemd service)                   │
│  ├─ Backend (FastAPI) → :8000                       │
│  ├─ Frontend (Vite) → :8005                         │
│  └─ Databases (Docker) → :8001-8003                 │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Purchase domain** from Cloudflare Registrar
2. **Create tunnel** in Cloudflare dashboard
3. **Configure hostnames** for frontend and API
4. **Update CORS settings** in backend
5. **Test on mobile** devices (iOS and Android)
6. **Enable auto-start** with systemd
7. **Monitor tunnel health** in dashboard

---

## Additional Resources

- [Cloudflare Tunnel Official Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/)
- [PWA Installation Guide](https://web.dev/customize-install/)
- [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
- [Cloudflare Registrar](https://domains.cloudflare.com/)

---

**Questions or Issues?** Check the troubleshooting section above or consult the Cloudflare Community forums.
