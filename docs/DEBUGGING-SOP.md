# SweatBot Debugging Standard Operating Procedure (SOP)

**Version**: 1.0
**Last Updated**: October 11, 2025
**Status**: Active

---

## 🎯 Purpose

This SOP provides a systematic approach to debugging issues in SweatBot, with emphasis on **infrastructure-first troubleshooting** to minimize wasted debugging time.

## 🚨 Golden Rule

**10 minutes verifying infrastructure can save 10 hours debugging application code.**

---

## 📋 Universal Debugging Protocol

### Phase 1: Infrastructure Verification (MANDATORY FIRST STEP)

**Time Allocation**: 5-10 minutes
**Success Rate**: Resolves 60-80% of reported issues

#### Step 1.1: Docker Container Health Check

```bash
# Check all SweatBot containers
docker ps -a | grep sweatbot

# Expected output: All containers showing "Up X seconds/minutes (healthy)"
# RED FLAG: Any container showing "Restarting" or "Exited"
```

**Interpretation Guide**:
- ✅ `Up 2 minutes (healthy)` → Container is running correctly
- ⚠️ `Up 5 seconds` → Container recently restarted, may indicate crash loop
- ❌ `Restarting (1) 3 seconds ago` → Container in crash loop (CRITICAL)
- ❌ `Exited (1) 2 minutes ago` → Container crashed and didn't restart

**If ANY container is unhealthy**: Skip to [Phase 2: Infrastructure Recovery](#phase-2-infrastructure-recovery)

#### Step 1.2: Database Connectivity Test

```bash
# Test MongoDB
docker exec sweatbot_mongodb mongosh --quiet --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }

# Test Redis
docker exec sweatbot_redis redis-cli -a $(doppler secrets get REDIS_PASSWORD --plain) ping
# Expected: PONG

# Test PostgreSQL
docker exec sweatbot_postgres psql -U fitness_user -d hebrew_fitness -c "SELECT 1"
# Expected:
#  ?column?
# ----------
#         1
# (1 row)
```

**If ANY database fails to respond**: Container is running but service is broken → Check logs

#### Step 1.3: Environment Variables Verification

```bash
# Verify Doppler secrets are loaded
doppler secrets

# Check if Docker Compose was started WITH Doppler
# Review command history or process arguments

# Common mistake detection:
ps aux | grep docker-compose
# If you see just "docker-compose up" without "doppler run", that's the problem!
```

**Critical Question**: Were containers started with `doppler run -- docker-compose up -d`?
- ✅ YES → Environment variables properly injected
- ❌ NO → Missing secrets, containers will crash → **FIX IMMEDIATELY**

#### Step 1.4: Service Connectivity Test

```bash
# Test backend API
curl -s http://localhost:8000/health/detailed | jq

# Test frontend
curl -s http://localhost:8005 | head -20

# Expected: Both should return valid responses
```

#### Step 1.5: Authentication Flow Check

```bash
# Check if JWT tokens are being generated
# Open browser console → Application → Local Storage
# Look for: sweatbot_auth_token

# Test authenticated endpoint
TOKEN=$(echo 'copy from browser localStorage')
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/memory/sessions
```

---

### Phase 2: Infrastructure Recovery

**Trigger**: One or more infrastructure checks failed in Phase 1

#### Recovery Protocol for Crash Loop

```bash
# 1. Stop all containers
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/config/docker
docker-compose down

# 2. Verify Doppler secrets are accessible
doppler secrets

# 3. Restart containers WITH Doppler
doppler run -- docker-compose up -d

# 4. Wait for containers to initialize (30 seconds)
sleep 30

# 5. Re-verify all containers are healthy
docker ps | grep sweatbot

# 6. Test database connections (repeat Step 1.2)
```

#### Recovery Protocol for Missing Environment Variables

```bash
# Check Doppler configuration
doppler setup --project sweatbot --config dev

# Verify secrets exist
doppler secrets | grep -E "POSTGRES_PASSWORD|MONGODB_PASSWORD|REDIS_PASSWORD"

# If secrets are missing, regenerate them
doppler secrets set POSTGRES_PASSWORD=$(openssl rand -base64 32)
doppler secrets set MONGODB_PASSWORD=$(openssl rand -base64 32)
doppler secrets set REDIS_PASSWORD=$(openssl rand -base64 32)

# Restart containers with new secrets
cd config/docker
docker-compose down
doppler run -- docker-compose up -d
```

---

### Phase 3: Application Layer Debugging

**ONLY proceed to this phase if ALL infrastructure checks passed**

#### Step 3.1: Backend API Diagnostics

```bash
# Check backend logs
docker logs sweatbot_backend --tail 100

# Test specific endpoints
curl -v http://localhost:8000/exercises/statistics
curl -v http://localhost:8000/api/memory/sessions

# Look for:
# - 500 errors (backend code issues)
# - 401/403 errors (authentication problems)
# - 404 errors (routing issues)
```

#### Step 3.2: Frontend Console Diagnostics

**Open Browser DevTools (F12)**:
1. **Console Tab**: Look for JavaScript errors
2. **Network Tab**: Check failed API requests
3. **Application Tab → Local Storage**: Verify `sweatbot_auth_token` exists

**Common Frontend Issues**:
- CORS errors → Backend CORS configuration problem
- 401 Unauthorized → Token expired or invalid
- Network timeout → Backend not responding

#### Step 3.3: Database Query Verification

```bash
# Check MongoDB conversations
docker exec sweatbot_mongodb mongosh --quiet --eval "
  use sweatbot_conversations;
  db.conversations.countDocuments({});
"

# Check PostgreSQL exercises
docker exec sweatbot_postgres psql -U fitness_user -d hebrew_fitness -c "
  SELECT COUNT(*) FROM exercises;
"

# Check Redis cache
docker exec sweatbot_redis redis-cli -a $(doppler secrets get REDIS_PASSWORD --plain) KEYS '*'
```

---

## 🔍 Common Issue Patterns

### Pattern 1: "Features Appear Disconnected"

**Symptoms**:
- Chat history not showing exercises
- Statistics not updating after logging exercises
- Data appears in one system but not another

**Root Causes (in order of frequency)**:
1. **Infrastructure**: Databases crashed/restarting (60%)
2. **Authentication**: Different user tokens used (25%)
3. **Code**: Actual data flow bug (15%)

**Debugging Steps**:
1. ✅ Phase 1: Infrastructure → Usually resolves the issue
2. ✅ Check browser localStorage → Same user ID across sessions?
3. ✅ Check database directly → Is data actually being stored?
4. ⚠️ Only then check application code

---

### Pattern 2: "Data Not Persisting"

**Symptoms**:
- User logs exercise, but it disappears on refresh
- Chat messages not showing in history
- Statistics reset unexpectedly

**Root Causes**:
1. **Database crash loop**: Data written but container restarted (50%)
2. **Missing authentication**: Guest tokens expiring (30%)
3. **Frontend cache**: UI showing old cached data (15%)
4. **Backend bug**: Actual persistence failure (5%)

**Debugging Steps**:
1. ✅ Check container health (Step 1.1)
2. ✅ Verify database has data: `db.conversations.find()`
3. ✅ Clear browser cache and retry
4. ✅ Check backend logs for write errors

---

### Pattern 3: "Endpoint Returns 401/403"

**Symptoms**:
- API requests fail with authentication errors
- User logged in but gets "Not authenticated"

**Root Causes**:
1. **JWT token expired**: Guest tokens have 23-hour lifespan (60%)
2. **Token not sent**: Frontend not including Authorization header (25%)
3. **Backend JWT secret changed**: Token signature invalid (10%)
4. **User account deleted**: Valid token for non-existent user (5%)

**Debugging Steps**:
1. ✅ Check token in localStorage → Decode JWT at jwt.io
2. ✅ Check if token is being sent: Browser Network Tab → Headers
3. ✅ Backend logs: Look for "Auth successful" vs "Not authenticated"
4. ✅ Verify `SECRET_KEY` in Doppler hasn't changed

---

## 📊 Case Studies

### Case Study 1: History & Statistics "Disconnection" (October 2025)

**Reported Issue**:
> "Chat history and exercise statistics are not connected - they seem to be using different databases or user IDs"

**Investigation Timeline**:
- 00:00 - Issue reported
- 00:05 - Started checking authentication code (❌ wrong approach)
- 00:20 - Reviewed data flow architecture (❌ still wrong)
- 00:35 - Checked infrastructure → **Found crash loop immediately**
- 00:40 - Restarted with Doppler → **Issue resolved**

**Root Cause**:
MongoDB and Redis in crash loop due to missing environment variables. Containers were started with `docker-compose up -d` instead of `doppler run -- docker-compose up -d`.

**Lesson Learned**:
If infrastructure verification had been done FIRST (5 minutes), 35 minutes of wasted debugging would have been avoided. **Always check infrastructure before code.**

**Fix Applied**:
```bash
cd config/docker
docker-compose down
doppler run -- docker-compose up -d
```

**Prevention**:
Added to CLAUDE.md and created this SOP to enforce infrastructure-first debugging.

---

## ✅ Infrastructure Health Checklist

**Use this checklist before reporting ANY bug or starting debugging:**

### Pre-Debugging Checklist
- [ ] All Docker containers showing "Up X seconds/minutes (healthy)"
- [ ] MongoDB responds to ping with `{ ok: 1 }`
- [ ] Redis responds to ping with `PONG`
- [ ] PostgreSQL responds to `SELECT 1` successfully
- [ ] Doppler secrets accessible via `doppler secrets`
- [ ] Backend API health endpoint returns 200 OK
- [ ] Frontend loads without console errors
- [ ] JWT token exists in browser localStorage
- [ ] Authenticated API request returns data (not 401)

**If ALL checks pass**: Proceed to application layer debugging
**If ANY check fails**: Follow recovery protocol for that component

---

## 🚀 Quick Reference Commands

### Infrastructure Health Check (One-Liner)
```bash
# Comprehensive health check
docker ps | grep sweatbot && \
  docker exec sweatbot_mongodb mongosh --quiet --eval "db.adminCommand('ping')" && \
  docker exec sweatbot_redis redis-cli -a $(doppler secrets get REDIS_PASSWORD --plain) ping && \
  docker exec sweatbot_postgres psql -U fitness_user -d hebrew_fitness -c "SELECT 1" && \
  curl -s http://localhost:8000/health/detailed | jq '.status' && \
  echo "✅ All infrastructure checks passed"
```

### Full System Restart
```bash
# Nuclear option: Restart everything
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/config/docker
docker-compose down
doppler run -- docker-compose up -d
sleep 30
docker ps | grep sweatbot
```

### Database Connection Test
```bash
# Test all databases in sequence
echo "Testing MongoDB..." && \
  docker exec sweatbot_mongodb mongosh --quiet --eval "db.adminCommand('ping')" && \
echo "Testing Redis..." && \
  docker exec sweatbot_redis redis-cli -a $(doppler secrets get REDIS_PASSWORD --plain) ping && \
echo "Testing PostgreSQL..." && \
  docker exec sweatbot_postgres psql -U fitness_user -d hebrew_fitness -c "SELECT 1" && \
echo "✅ All databases healthy"
```

---

## 📝 Debugging Log Template

**When reporting an issue, include this information:**

```markdown
### Issue Report

**Problem Description**: [What's not working]

**Infrastructure Checks**:
- [ ] Docker containers: [Status]
- [ ] MongoDB: [✅ Healthy / ❌ Failed / ⚠️ Warning]
- [ ] Redis: [✅ Healthy / ❌ Failed / ⚠️ Warning]
- [ ] PostgreSQL: [✅ Healthy / ❌ Failed / ⚠️ Warning]
- [ ] Doppler secrets: [✅ Loaded / ❌ Missing]
- [ ] Backend API: [✅ Responding / ❌ Down]

**Container Logs** (if unhealthy):
```
[Paste relevant logs here]
```

**Browser Console Errors** (if applicable):
```
[Paste errors here]
```

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
```

---

## 🎓 Training & Onboarding

**For new developers working on SweatBot:**

1. Read this SOP completely
2. Run through infrastructure health check manually
3. Intentionally break one component and fix it using SOP
4. Review Case Study 1 to understand the cost of skipping infrastructure checks

**Remember**: The goal is not to memorize all commands, but to internalize the **infrastructure-first mindset**.

---

## 📚 Related Documentation

- **CLAUDE.md**: Complete project guidelines and critical rules
- **README.md**: Project overview and setup instructions
- **docker-compose.yml**: Infrastructure configuration
- **Doppler Documentation**: Secrets management

---

## 🔄 SOP Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Oct 11, 2025 | Initial creation based on History/Stats debugging experience | Claude + User |

---

**Last Updated**: October 11, 2025
**Next Review**: January 2026
