# SOP: MongoDB Authentication Issues

**Last Updated**: October 12, 2025
**Status**: Production-Ready
**Related Issues**: Login failures, conversation history errors, 500 errors

---

## Problem Recognition

### Symptoms
- **MongoDB logs**: "SCRAM authentication failed, storedKey mismatch"
- **Backend errors**: 500 Internal Server Error when accessing `/api/memory/*` endpoints
- **Frontend**: "Could not load conversation history" warnings
- **Chat**: Conversation history fails to load or persist

### When This Happens
- After Docker container restarts
- After database password changes
- After Doppler configuration updates
- Fresh deployments without proper environment setup

---

## Root Cause Analysis

### Why MongoDB Authentication Fails

**MongoDB Root User Configuration**:
```yaml
# docker-compose.yml
environment:
  MONGO_INITDB_ROOT_USERNAME: sweatbot
  MONGO_INITDB_ROOT_PASSWORD: ${MONGODB_PASSWORD}
```

**Critical Connection String Format**:
```
mongodb://sweatbot:PASSWORD@localhost:8002/sweatbot_conversations?authSource=admin
                                                                   ^^^^^^^^^^^^^^^^
                                                                   CRITICAL PARAMETER
```

**Why `authSource=admin` is Required**:
- MongoDB root users are created in the `admin` database
- Without `authSource=admin`, MongoDB looks for credentials in `sweatbot_conversations` database
- Result: Authentication fails even with correct password

### Backend Configuration

Backend reads MongoDB connection from environment variable:

**File**: `backend/app/api/v1/memory.py:21` and `backend/app/api/v1/chat.py:468`
```python
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://sweatbot:secure_password@localhost:8002/")
```

**Default fallback password**: `secure_password` (WRONG - only for emergency fallback)

---

## Solution Protocol

### Step 1: Verify Doppler Configuration

```bash
# Check if MONGODB_URL exists
cd /path/to/sweatbot
doppler secrets get MONGODB_URL --plain

# Should return:
# mongodb://sweatbot:nf9WpigN9E2OXxhRQBRdM7mdGaDUBHZjizJ2abEQL40=@localhost:8002/sweatbot_conversations?authSource=admin
```

### Step 2: Fix Missing/Incorrect MONGODB_URL

```bash
# Get the correct password from Doppler
MONGODB_PASSWORD=$(doppler secrets get MONGODB_PASSWORD --plain)

# Set the complete connection string
doppler secrets set MONGODB_URL="mongodb://sweatbot:${MONGODB_PASSWORD}@localhost:8002/sweatbot_conversations?authSource=admin"
```

### Step 3: Verify MongoDB Connection

```bash
# Test MongoDB authentication directly
docker exec sweatbot_mongodb mongosh \
  --username sweatbot \
  --password "$(doppler secrets get MONGODB_PASSWORD --plain)" \
  --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"

# Should return: { ok: 1 }
```

### Step 4: Restart Backend

```bash
# Stop backend
lsof -ti:8000 | xargs kill -9

# Start with Doppler secrets
cd backend
doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 5: Verify Fix

```bash
# Check backend health
curl http://localhost:8000/health/detailed

# Check MongoDB logs (should have no auth errors)
docker logs sweatbot_mongodb --since 2m | grep -i authentication

# Test conversation history endpoint
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "noamnau", "password": "Noam123"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/api/memory/context/USER_ID?limit=20"

# Should return: {"messages": [...]} (not 500 error)
```

---

## Prevention Checklist

### For New Deployments
- [ ] Set `MONGODB_PASSWORD` in Doppler first
- [ ] Set `MONGODB_URL` with complete connection string (including `?authSource=admin`)
- [ ] Verify docker-compose.yml uses `${MONGODB_PASSWORD}` variable
- [ ] Start Docker containers with `doppler run -- docker-compose up -d`
- [ ] Test MongoDB connection before starting backend

### For Existing Systems
- [ ] Verify Doppler has both `MONGODB_PASSWORD` and `MONGODB_URL`
- [ ] Check `MONGODB_URL` includes `?authSource=admin` parameter
- [ ] Ensure backend is started with `doppler run --`
- [ ] Monitor MongoDB logs for authentication errors after restarts

### After Password Changes
- [ ] Update `MONGODB_PASSWORD` in Doppler
- [ ] Update `MONGODB_URL` with new password
- [ ] Restart Docker containers
- [ ] Restart backend
- [ ] Verify authentication with test commands

---

## Quick Reference

### Critical Files
- **Backend MongoDB Config**: `backend/app/api/v1/memory.py:21`
- **Backend Chat MongoDB**: `backend/app/api/v1/chat.py:468`
- **Docker Compose**: `config/docker/docker-compose.yml:51-52`

### Environment Variables (Doppler)
```bash
MONGODB_PASSWORD=nf9WpigN9E2OXxhRQBRdM7mdGaDUBHZjizJ2abEQL40=
MONGODB_URL=mongodb://sweatbot:nf9WpigN9E2OXxhRQBRdM7mdGaDUBHZjizJ2abEQL40=@localhost:8002/sweatbot_conversations?authSource=admin
MONGODB_DATABASE=sweatbot_conversations  # Optional (has default)
```

### Test Commands
```bash
# Quick MongoDB test
docker exec sweatbot_mongodb mongosh --eval "db.version()"

# Check authentication
docker exec sweatbot_mongodb mongosh \
  --username sweatbot \
  --password "PASSWORD_HERE" \
  --authenticationDatabase admin \
  --eval "db.adminCommand('ping')"

# Check backend MongoDB connection
curl http://localhost:8000/api/memory/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Mistakes

### ❌ Missing `authSource=admin`
```
mongodb://sweatbot:password@localhost:8002/sweatbot_conversations
                                                                   ← Missing parameter!
```
**Result**: Authentication fails, MongoDB logs show "SCRAM failed"

### ❌ Using Wrong Database for Auth
```
mongodb://sweatbot:password@localhost:8002/sweatbot_conversations?authSource=sweatbot_conversations
                                                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                                   WRONG! Should be "admin"
```

### ❌ Hardcoded Password in Code
```python
# DON'T DO THIS
MONGODB_URL = "mongodb://sweatbot:secure_password@localhost:8002/"
```
**Always use**: `os.getenv("MONGODB_URL")` with Doppler secrets

### ❌ Starting Backend Without Doppler
```bash
# WRONG
python -m uvicorn app.main:app --reload

# CORRECT
doppler run -- python -m uvicorn app.main:app --reload
```

---

## Troubleshooting

### Issue: "SCRAM authentication failed"
**Check**:
1. Verify `MONGODB_URL` includes `?authSource=admin`
2. Confirm password matches between Doppler and Docker container
3. Ensure backend started with `doppler run --`

### Issue: "Failed to connect to MongoDB"
**Check**:
1. Docker container running: `docker ps | grep mongodb`
2. Port 8002 accessible: `curl localhost:8002` (should connect)
3. MongoDB process running in container: `docker logs sweatbot_mongodb`

### Issue: Backend uses wrong password
**Check**:
1. Environment variable loaded: `echo $MONGODB_URL` (if using export)
2. Doppler project configured: `doppler setup`
3. Backend restarted after Doppler changes

---

## Related Documentation
- [AUTHENTICATION.md](main-docs/AUTHENTICATION.md) - User authentication system
- [CLAUDE.md](../CLAUDE.md) - Infrastructure-first debugging protocol
- [docker-compose.yml](../config/docker/docker-compose.yml) - Docker configuration

---

## Version History
- **v1.0** (Oct 12, 2025): Initial SOP creation after fixing MongoDB authentication issues
