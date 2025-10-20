# 🔐 Doppler Setup Guide for SweatBot

**Purpose**: Configure Doppler for secure production secrets management

**Time**: 15 minutes

**Why Doppler**: Keep secrets safe, auto-sync to production, easy rotation, audit trail

---

## 📋 What You'll Learn

- Create Doppler account and project
- Set up production configuration
- Generate service token for Render
- Store secrets securely
- Sync secrets to production
- Rotate secrets safely

---

## Step 1: Create Doppler Account

1. Go to **https://doppler.com**
2. Click **"Sign Up Free"**
3. Choose sign-up method (GitHub recommended)
4. Verify email
5. Accept terms

You now have free Doppler account! ✅

---

## Step 2: Create Project

1. From Doppler dashboard, click **"Create Project"**
2. **Project Name**: `sweatbot`
3. **Description**: `SweatBot - Exercise AI Assistant`
4. Click **"Create Project"**

Project created! ✅

---

## Step 3: Create Configuration

### What are Configs?
Configs are environment-specific secret collections:
- `dev` = Local development
- `stg` = Staging/testing
- `prd` = Production

### Create Production Config:

1. In your `sweatbot` project, click **"Create Config"**
2. **Config Name**: `prd`
3. **Description**: `Production secrets for Render`
4. Click **"Create"**

Configuration created! ✅

---

## Step 4: Add Secrets to Production Config

1. You're now in `sweatbot/prd` config
2. Click **"Add Secret"**
3. Add these secrets one by one:

### Required Secrets:

**SECRET_KEY** (API token signing):
```
Name: SECRET_KEY
Value: <generate using: python3 -c "import secrets; print(secrets.token_urlsafe(32))">
```

**DEBUG** (Debug mode):
```
Name: DEBUG
Value: false
```

**Example:**
```
Name: EXAMPLE_API_KEY
Value: test-key-12345
```

### Optional (add only if using):

**REDIS_URL** (if using Redis cache):
```
Name: REDIS_URL
Value: redis://host:6379/0
```

**MONGODB_URL** (if using MongoDB):
```
Name: MONGODB_URL
Value: mongodb://localhost:27017/sweatbot
```

---

## Step 5: Generate Service Token

Service tokens authenticate Render to Doppler.

1. In Doppler `sweatbot/prd` config
2. Click **"Access"** tab (top of page)
3. Click **"Generate"** button
4. **Token Name**: `render-sweatbot`
5. **Permissions**: Keep defaults (read-only)
6. Click **"Generate"**

You'll see the token (format: `dp.st_prd_xxx...`) ✅

**Important**: Copy this token, you'll need it in next step

---

## Step 6: Add Token to Render

1. Go to your Render web service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"**
4. **Key**: `DOPPLER_SERVICE_TOKEN`
5. **Value**: Paste your token from Step 5
6. Click **"Save"**

Render now has access to Doppler! ✅

---

## Step 7: Verify Integration

After Render redeploys (takes 2-3 minutes):

```bash
# Test that secrets are loading
curl https://your-service-name.onrender.com/health

# Should return (if secrets loaded correctly):
# {"status": "ok", "database": "connected"}
```

If you get an error:
- Check logs in Render dashboard
- Look for "Doppler" errors
- Verify token was copied correctly
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 🔄 Managing Secrets

### Add New Secret:

1. In Doppler `sweatbot/prd`
2. Click **"Add Secret"**
3. Enter name and value
4. Click **"Save"**
5. Render automatically syncs (1-2 min)
6. No redeploy needed!

### Update Existing Secret:

1. Click on secret name
2. Edit value
3. Click **"Save"**
4. Render auto-syncs

### Delete Secret:

1. Click the 🗑️ icon next to secret
2. Confirm
3. Render auto-syncs

---

## 🔐 Security Best Practices

### 1. Token Rotation
- Generate new token every quarter
- Delete old token from Doppler
- Update DOPPLER_SERVICE_TOKEN in Render
- Old token immediately stops working

### 2. Secret Rotation
- Change SECRET_KEY every 6 months
- Rotate API keys when team changes
- Database password yearly
- Update in Doppler, Render auto-syncs

### 3. Team Access
- Only give Doppler access to developers
- Use service tokens for CI/CD
- Limit who can delete secrets
- Review access regularly

### 4. Audit Trail
- Doppler logs all changes
- Who made change, when, what changed
- Use for security reviews
- Can audit for compliance

---

## 🧪 Test Doppler Integration

### From Local Machine:

1. Install Doppler CLI:
   ```bash
   # On macOS
   brew install doppler
   
   # On Windows (in PowerShell as Admin)
   choco install doppler
   
   # On Linux
   curl -Ls https://cli.doppler.com/install.sh | sudo sh
   ```

2. Authenticate:
   ```bash
   doppler login
   # Opens browser, authenticate with GitHub
   ```

3. Run with Doppler:
   ```bash
   cd sweatbot
   doppler run -- python -m uvicorn backend.app.main:app --reload
   ```

4. Secrets are injected into app! ✅

### From Render:

Render automatically runs: `doppler run -- python -m uvicorn backend.app.main:app ...`

So secrets are injected at startup. ✅

---

## 📊 Doppler Dashboard Features

### Secrets Tab
- View all secrets (values hidden)
- Add/edit/delete secrets
- Search by name
- See creation/edit time

### Access Tab
- Manage service tokens
- Generate/revoke tokens
- See token creation date
- View last used date

### Audit Log Tab
- Who made changes
- When changes were made
- What was changed
- From where (IP address)

### Settings Tab
- Project name/description
- Team management
- Webhooks (advanced)
- API access (advanced)

---

## 🐛 Common Issues

### Issue: "Service token invalid"

**Error**: Render logs show `Invalid token`

**Fix**:
1. Verify token still exists in Doppler
2. Check it wasn't accidentally deleted
3. Generate new token if needed
4. Update DOPPLER_SERVICE_TOKEN in Render

### Issue: "Secrets not syncing"

**Error**: New secrets in Doppler don't appear in app

**Fix**:
1. Wait 1-2 minutes (sync delay)
2. Check Render logs for errors
3. Verify token still valid
4. Manually redeploy: Click Deploy button in Render

### Issue: "Permission denied"

**Error**: `Access Denied` in Doppler

**Fix**:
1. Check if you're invited to project
2. Ask team member with Doppler admin access
3. Verify email is registered with Doppler

---

## 📚 Doppler Resources

- **Doppler Docs**: https://docs.doppler.com/
- **CLI Reference**: https://docs.doppler.com/cli/cli-command-reference
- **Render Integration**: https://docs.doppler.com/docs/render
- **Pricing**: https://doppler.com/pricing (free tier available)

---

## ✅ Success Checklist

- ✅ Doppler account created
- ✅ `sweatbot` project created
- ✅ `prd` config created
- ✅ Secrets added to `prd`
- ✅ Service token generated
- ✅ Token added to Render
- ✅ Render auto-syncs secrets
- ✅ `/health` endpoint returns 200

---

## 🎉 Next Steps

1. **Keep Doppler dashboard bookmarked** for secret updates
2. **Set calendar reminder** for quarterly token rotation
3. **Add team members** if collaborating (Doppler settings)
4. **Review audit log** weekly for security
5. **Update this guide** if process changes

---

## 📚 Related Guides

- [QUICK_START.md](QUICK_START.md) - Deploy in 5 minutes
- [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) - Full deployment reference
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - All environment variables
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Fix deployment issues
