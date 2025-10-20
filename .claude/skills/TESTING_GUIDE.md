# 🧪 SweatBot Testing Guide - Complete Testing Procedures

**Purpose**: Comprehensive testing procedures for SweatBot Node.js backend using systematic skill-based approach
**Based On**: Real testing patterns and debugging sessions
**Last Updated**: October 2025

---

## 📋 Testing Philosophy

**Infrastructure-First Testing**: Always verify infrastructure before application code
**Evidence-Based Results**: Never claim functionality works without actual testing verification
**Systematic Approach**: Use documented procedures for consistent results across sessions

---

## 🎯 Quick Reference

| Test Type | Purpose | Command/Tool | Expected Result |
|----------|---------|-------------|----------------|
| **Health Check** | Basic server connectivity | `curl /health` | `{"status":"healthy"}` |
| **Database Test** | Verify all DB connections | Check health response | `✅ Connected` for all |
| **Chat API** | AI functionality test | POST `/api/v1/chatSimple` | JSON response with AI |
| **Migration Test** | Database schema test | Manual check | Tables created successfully |
| **Authentication** | User system test | Register/Login flow | JWT tokens generated |
| **Frontend E2E** | Visual interface test | Playwright MCP | Full conversation flow working |

| **Health Check** | Basic server connectivity | `curl /health` | `{"status":"healthy"}` |
| **Database Test** | Verify all DB connections | Check health response | `✅ Connected` for all |
| **Chat API** | AI functionality test | POST `/api/v1/chatSimple` | JSON response with AI |
| **Migration Test** | Database schema test | Manual check | Tables created successfully |
| **Authentication** | User system test | Register/Login flow | JWT tokens generated |

---

## 🚀 Pre-Testing Checklist

### Infrastructure Verification (ALWAYS FIRST)

**1. Docker Containers Status**
```bash
# Check all SweatBot containers
docker ps -a --filter "name=sweatbot" --format "  {{.Names}}: {{.Status}}"

# Expected output:
# sweatbot_postgres: Up (healthy)
# sweatbot_redis: Up (healthy)
# sweatbot_mongodb: Up (healthy)
```

**2. Database Connectivity**
```bash
# Test PostgreSQL (use correct credentials)
PGPASSWORD=secure_password psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness -c "SELECT 1;"

# Test MongoDB
docker exec sweatbot_mongodb mongosh --quiet --eval "db.adminCommand('ping')"

# Test Redis
docker exec sweatbot_redis redis-cli -a sweatbot_redis_pass ping
```

**3. Port Availability**
```bash
# Check if port 8000 is free
lsof -ti:8000 || echo "Port 8000 is available"

# Kill any stuck processes if needed
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
```

### Environment Configuration

**4. Verify Environment Variables**
```bash
# Check critical environment variables
cd backend && echo "DATABASE_URL: $DATABASE_URL"
echo "MONGODB_URL: $MONGODB_URL"
echo "REDIS_URL: $REDIS_URL"
echo "PORT: $PORT"
```

---

## 🔧 Server Testing Procedures

### 1. Health Endpoint Test

**Purpose**: Verify server starts and responds correctly

**Test Procedure**:
```bash
# Start server in background
cd backend && node dist/server-real.js &
SERVER_PID=$!

# Wait for initialization (critical!)
sleep 8

# Test health endpoint
curl -s http://localhost:8000/health | jq . || echo "Health check failed"

# Expected response structure:
{
  "status": "healthy",
  "service": "sweatbot-api",
  "version": "2.0.0",
  "features": {
    "authentication": "✅ Working",
    "ai_chat": "✅ Working",
    "databases": "✅ Connected",
    "postgresql": "✅ Connected",
    "mongodb": "✅ Connected",
    "redis": "✅ Connected"
  }
}

# Cleanup
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
```

**Success Indicators**:
- ✅ Server starts without crashing
- ✅ Health endpoint returns JSON response
- ✅ All databases show "✅ Connected" status
- ✅ Server runs on correct port (8000)

### 2. Database Migrations Test

**Purpose**: Verify database schema creation and updates

**Test Procedure**:
```bash
# Check migration files exist
ls -la backend/migrations/
# Expected: 001_create_users.sql, 002_create_exercise_logs.sql, 003_create_points_records.sql

# Start server and check migration logs
cd backend && node dist/server-real.js 2>&1 | grep -E "(migration|Migrations|✅|❌)" &
SERVER_PID=$!

sleep 10

# Check migrations table (if server started)
if kill -0 $SERVER_PID 2>/dev/null; then
  PGPASSWORD=secure_password psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness -c "SELECT filename FROM migrations ORDER BY filename;"
fi

kill $SERVER_PID 2>/dev/null || true
```

**Success Indicators**:
- ✅ Migration files found and executed
- ✅ Tables created successfully
- ✅ No migration errors in logs
- ✅ Migrations table tracks executed files

### 3. Chat API Integration Test

**Purpose**: Verify AI provider integration and response generation

**Test Procedure**:
```bash
# Start server
cd backend && node dist/server-real.js &
SERVER_PID=$!
sleep 8

# Test Chat API with OpenAI
curl -X POST http://localhost:8000/api/v1/chatSimple \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "provider": "openai"
  }' | jq .

# Expected response structure:
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing well...",
    "provider": "openai",
    "model": "gpt-4o-mini",
    "tokens": 45,
    "responseTime": 1234
  },
  "timestamp": "2025-10-19T..."
}

# Test Provider Health
curl -s http://localhost:8000/api/v1/providers/health | jq .

# Expected:
{
  "providers": [
    {"provider": "openai", "status": "healthy"},
    {"provider": "groq", "status": "unhealthy"}
  ]
}

kill $SERVER_PID 2>/dev/null || true
```

**Success Indicators**:
- ✅ Chat API returns JSON response with AI-generated content
- ✅ Response includes provider, model, tokens, timing info
- ✅ Provider health endpoint shows provider status
- ✅ No authentication or API key errors

### 4. Database Operations Test

**Purpose**: Verify CRUD operations work correctly

**Test Procedure**:
```bash
# Start server
cd backend && node dist/server-real.js &
SERVER_PID=$!
sleep 8

# Test user registration
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User"
  }' | jq .

# Test exercise logging (requires auth token first)
# 1. Register and get token
# 2. Log exercise with token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User"}' | jq -r '.data.token')

curl -X POST http://localhost:8000/api/v1/exercises/log \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "exercise": "Push-ups",
    "reps": 20,
    "sets": 3
  }' | jq .

# Test statistics retrieval
curl -X GET http://localhost:8000/api/v1/exercises/statistics \
  -H "Authorization: Bearer $TOKEN" | jq .

kill $SERVER_PID 2>/dev/null || true
```

**Success Indicators**:
- ✅ User registration creates account successfully
- ✅ JWT tokens generated and returned
- ✅ Exercise logging works with authentication
- ✅ Statistics endpoint returns data
- ✅ Database persistence confirmed

### 5. 🎭 Frontend End-to-End Testing (MOST IMPORTANT)

**Purpose**: Complete visual verification of user experience through browser automation
**Tool**: Playwright MCP (required for true E2E testing)
**Goal**: Verify complete conversation flow with AI bot works visually

**⚠️ Playwright MCP Availability Check**:
```bash
# Check if Playwright MCP is available
mcp__playwright__playwright_navigate --help 2>/dev/null && echo "✅ Playwright MCP available" || echo "❌ Playwright MCP NOT AVAILABLE - Claude Code will tell you this"
```

**Test Requirements**:
- ✅ Backend server running on port 8000
- ✅ Frontend development server running on port 8005
- ✅ Playwright MCP installed and configured
- ✅ Full stack integration working

**Complete E2E Test Procedure**:

**Step 1: Infrastructure Setup**
```bash
# Start backend (if not already running)
cd backend && node dist/server-real.js &
BACKEND_PID=$!
sleep 8

# Start frontend (personal-ui-vite)
cd ../personal-ui-vite && npm run dev &
FRONTEND_PID=$!
sleep 10

# Verify both services are running
curl -s http://localhost:8000/health > /dev/null && echo "✅ Backend ready" || echo "❌ Backend failed"
curl -s http://localhost:8005 > /dev/null && echo "✅ Frontend ready" || echo "❌ Frontend failed"
```

**Step 2: User Authentication & Chat History E2E Test**
```bash
# Navigate to frontend
mcp__playwright__playwright_navigate --url http://localhost:8005

# Wait for page to load
sleep 5

# Take initial screenshot (guest state)
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/01-frontend-guest-loaded.png

# === PHASE 1: TEST USER SIGNUP ===

# Look for signup/login button (common patterns: button, link with text "Sign up", "Login", "Register")
mcp__playwright__playwright_click --selector 'button:has-text("Sign up"), a:has-text("Sign up"), button:has-text("Register"), button:has-text("Login")' --first

# Wait for signup/login modal or page to load
sleep 3

# Take screenshot of signup form
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/02-signup-form-visible.png

# Fill in signup form (adjust selectors based on your UI)
mcp__playwright__playwright_fill --selector 'input[name="email"], input[type="email"], input[placeholder*="email"]' --value "testuser@sweatbot.com"
mcp__playwright__playwright_fill --selector 'input[name="username"], input[name="name"], input[placeholder*="name"], input[placeholder*="username"]' --value "TestUser"
mcp__playwright__playwright_fill --selector 'input[name="password"], input[type="password"], input[placeholder*="password"]' --value "TestPassword123!"

# Submit signup form
mcp__playwright__playwright_click --selector 'button[type="submit"], button:has-text("Sign up"), button:has-text("Register"), button:has-text("Create account")' --first

# Wait for account creation and login
sleep 8

# Take screenshot after successful signup (should show logged-in state)
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/03-user-signed-up-success.png

# === PHASE 2: TEST INITIAL CONVERSATION ===

# Find and click chat interface
mcp__playwright__playwright_click --selector 'textarea, [contenteditable="true"], .chat-input, .message-input' --first

# Type first message as logged-in user
mcp__playwright__playwright_fill --selector 'textarea, [contenteditable="true"], .chat-input, .message-input' --value "Hello SweatBot! I'm a new user. Can you help me start with a beginner workout plan?"

# Send the message
mcp__playwright__playwright_press_key --key 'Enter'

# Wait for AI response
sleep 15

# Take screenshot of first conversation
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/04-first-conversation-logged-in.png

# === PHASE 3: TEST EXERCISE LOGGING ===

# Test exercise logging as authenticated user
mcp__playwright__playwright_fill --selector 'textarea, [contenteditable="true"], .chat-input, .message-input' --value "I just completed 15 push-ups and 20 squats. Please log this workout."

# Send exercise
mcp__playwright__playwright_press_key --key 'Enter'
sleep 10

# Take screenshot of exercise logged (should show points/stats)
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/05-exercise-logged-authenticated.png

# === PHASE 4: TEST CHAT HISTORY PERSISTENCE ===

# Get visible text to verify conversation is saved
mcp__playwright__playwright_get_visible_text

# Close browser to simulate session end
mcp__playwright__playwright_close

# Wait a moment, then reopen browser to test persistence
sleep 3

# Navigate back to frontend
mcp__playwright__playwright_navigate --url http://localhost:8005

# Wait for page to load
sleep 5

# Take screenshot of returning user (should maintain login state)
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/06-returning-user-logged-in.png

# === PHASE 5: VERIFY CHAT HISTORY ===

# Look for chat history indicators (previous messages, history button, conversation list)
mcp__playwright__playwright_click --selector 'button:has-text("History"), .history-button, .chat-history, [data-testid="chat-history"]' --first

# Wait for history to load
sleep 3

# Take screenshot of chat history interface
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/07-chat-history-interface.png

# === PHASE 6: TEST CONTINUING CONVERSATION ===

# Send another message to test context continuity
mcp__playwright__playwright_click --selector 'textarea, [contenteditable="true"], .chat-input, .message-input' --first
mcp__playwright__playwright_fill --selector 'textarea, [contenteditable="true"], .chat-input, .message-input' --value "Can you see my previous workout from today? I want to continue my training."

# Send message
mcp__playwright__playwright_press_key --key 'Enter'
sleep 15

# Take screenshot of contextual conversation (AI should remember previous exercises)
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/08-contextual-conversation-working.png

# === PHASE 7: TEST USER PROFILE/STATS ===

# Look for profile, stats, or dashboard elements
mcp__playwright__playwright_click --selector 'button:has-text("Profile"), button:has-text("Stats"), button:has-text("Dashboard"), .profile-button, .stats-button' --first

# Wait for profile/stats to load
sleep 5

# Take screenshot of user profile with workout history and statistics
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/09-user-profile-stats-visible.png

# === PHASE 8: TEST LOGOUT ===

# Look for logout functionality
mcp__playwright__playwright_click --selector 'button:has-text("Logout"), button:has-text("Sign out"), .logout-button' --first

# Wait for logout to complete
sleep 3

# Take screenshot of logged out state
mcp__playwright__playwright_screenshot --path /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/10-user-logged-out.png

# Close browser
mcp__playwright__playwright_close
```

**Step 3: Cleanup**
```bash
# Stop services
kill $BACKEND_PID 2>/dev/null || true
kill $FRONTEND_PID 2>/dev/null || true
wait
echo "E2E test completed - screenshots saved to docs/screenshots-debug/"
```

**Expected E2E Results**:
- ✅ Frontend loads successfully in guest state (screenshot 01)
- ✅ User signup/login flow works and creates account (screenshot 02-03)
- ✅ User is automatically logged in after signup (screenshot 03)
- ✅ Chat interface responds to user input as authenticated user
- ✅ AI bot generates meaningful responses with user context (screenshot 04)
- ✅ Exercise logging functionality works with user attribution (screenshot 05)
- ✅ Chat history persists across browser sessions (screenshot 06-07)
- ✅ AI maintains context from previous conversations (screenshot 08)
- ✅ User profile/stats display workout history and points (screenshot 09)
- ✅ User logout functionality works correctly (screenshot 10)
- ✅ Login state persists after browser restart (critical feature)
- ✅ Previous chat conversations are accessible and searchable
- ✅ No JavaScript errors in browser console
- ✅ Full authenticated user workflow works end-to-end
- ✅ Visual confirmation of all authentication and persistence features working

**If Playwright MCP is NOT Available**:
```bash
echo "⚠️ Playwright MCP not available - this is a limitation for visual E2E testing"
echo "💡 Claude Code will inform you when Playwright MCP is not available"
echo "📋 Alternative: Manual browser testing"
echo ""
echo "Manual E2E Test Procedure:"
echo "1. Start backend: cd backend && node dist/server-real.js"
echo "2. Start frontend: cd ../personal-ui-vite && npm run dev"
echo "3. Open browser to http://localhost:8005"
echo "4. Test user signup: Create account with email/password"
echo "5. Verify automatic login after signup"
echo "6. Test conversation: Send workout-related messages"
echo "7. Verify AI responds with contextual advice"
echo "8. Test exercise logging: Log specific exercises"
echo "9. Close browser, reopen to test persistence"
echo "10. Verify you're still logged in (login persistence)"
echo "11. Check chat history: Previous conversations visible"
echo "12. Test contextual memory: Ask about previous workout"
echo "13. Check user profile/stats with workout history"
echo "14. Test logout functionality"
echo "15. Take screenshots at each step for documentation"
echo ""
echo "❗ CRITICAL VERIFICATION POINTS:"
echo "- Account creation and login state persistence"
echo "- Chat history saved and accessible across sessions"
echo "- AI remembers previous exercises and context"
echo "- User statistics accumulate correctly"
echo "- Logout clears authentication state properly"
```

**E2E Success Verification**:

**Authentication & User Management**:
- [ ] User signup form loads and accepts input
- [ ] Account creation works without errors
- [ ] User is automatically logged in after signup
- [ ] Login state persists after browser restart
- [ ] User profile displays correctly with workout history
- [ ] Logout functionality works and clears authentication
- [ ] Guest users can use basic features before signup

**Chat & Conversation Features**:
- [ ] Chat interface accepts input for both guest and authenticated users
- [ ] AI responses are generated and displayed correctly
- [ ] Chat history is saved to database for authenticated users
- [ ] Previous conversations are accessible after browser restart
- [ ] AI maintains context from previous sessions
- [ ] Conversation history interface displays past chats
- [ ] Real-time chat responses work smoothly

**Exercise & Data Persistence**:
- [ ] Exercise logging works through the interface
- [ ] Exercises are attributed to correct user account
- [ ] Points and statistics accumulate properly
- [ ] Workout history displays in user profile
- [ ] Data persists across sessions for authenticated users
- [ ] Exercise data is accessible via chat and profile views

**Technical & UI Verification**:
- [ ] All UI components render properly with design system
- [ ] No broken functionality visible to user
- [ ] No JavaScript errors in browser console
- [ ] Responsive design works on different screen sizes
- [ ] Loading states and error handling work correctly
- [ ] Backend APIs respond correctly to frontend requests

**Playwright MCP Specific**:
- [ ] All 10 screenshots captured successfully
- [ ] Browser automation completed without timeout errors
- [ ] Visual verification matches expected results
- [ ] Playwright MCP tools executed successfully
- [ ] Test completed within reasonable time frame

---

## 🐛 Troubleshooting Test Failures

### Issue: Server Won't Start
**Symptoms**: No response to curl, process exits immediately

**Debug Steps Using Skills**:
1. Check **BACKEND_NODEJS_ARCHITECTURE.md** startup sequence
2. Verify environment variables with **ENVIRONMENT_SETUP.md**
3. Check database connectivity with **TROUBLESHOOTING.md**

**Common Solutions**:
```bash
# Check environment variables
cd backend && cat .env

# Kill stuck processes
lsof -ti:8000 | xargs kill -9

# Reset database (if needed)
PGPASSWORD=secure_password psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness -c "DROP TABLE IF EXISTS users CASCADE;"
```

### Issue: Database Connection Failures
**Symptoms**: "Connection refused", "Authentication failed", "Role does not exist"

**Debug Steps**:
1. Verify Docker containers are running: `docker ps`
2. Check credentials in `.env` vs Docker compose configuration
3. Test database connectivity directly with database clients

**Common Solutions**:
```bash
# Fix PostgreSQL credentials
# Docker compose uses: fitness_user / hebrew_fitness / secure_password
# Update .env to match:
DATABASE_URL=postgresql://fitness_user:secure_password@localhost:8001/hebrew_fitness

# Fix MongoDB credentials
MONGODB_URL=mongodb://localhost:8002/sweatbot

# Fix Redis credentials
REDIS_URL=redis://:sweatbot_redis_pass@localhost:8003/0
```

### Issue: API Returns 500 Errors
**Symptoms**: Internal server error, JSON parsing failures

**Debug Steps**:
1. Check server logs for detailed error messages
2. Test with simple server vs complex server
3. Verify request format matches expected schema

**Common Solutions**:
```bash
# Enable debug logging
export DEBUG=true

# Check request format
curl -X POST http://localhost:8000/api/v1/chatSimple \
  -H "Content-Type: application/json" \
  -d '{"message":"test","provider":"openai"}' -v
```

---

## 📊 Performance Testing

### Load Testing
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -s http://localhost:8000/health > /dev/null &
done
wait
echo "10 concurrent health checks completed"
```

### Response Time Testing
```bash
# Measure API response times
time curl -s http://localhost:8000/health > /dev/null
time curl -X POST http://localhost:8000/api/v1/chatSimple \
  -H "Content-Type: application/json" \
  -d '{"message":"test","provider":"openai"}' > /dev/null
```

---

## ✅ Success Checklists

### Server Startup Success
- [ ] Docker containers running and healthy
- [ ] Environment variables loaded correctly
- [ ] Server starts without crashing
- [ ] Health endpoint responds with success status
- [ ] All databases connected (PostgreSQL, MongoDB, Redis)
- [ ] No authentication or connection errors
- [ ] Server listening on correct port (8000)

### API Functionality Success
- [ ] Health check returns proper JSON structure
- [ ] Chat API generates AI responses
- [ ] Provider health check shows status
- [ ] User registration/login works
- [ ] Exercise CRUD operations function
- [ ] Statistics endpoints return data
- [ ] Authentication tokens work correctly

### Database Success
- [ ] Migrations run without errors
- [ ] Tables created with correct schema
- [ ] Data persists across server restarts
- [ ] Indexes created for performance
- [ ] Foreign key constraints work
- [ ] Database connections are stable

---

## 🔄 Continuous Testing Workflow

### Before Each Development Session:
1. **Check infrastructure**: Docker status, database connectivity
2. **Start server**: Verify health endpoint responds
3. **Test core functionality**: Chat API, authentication
4. **Verify database**: Check connections, test CRUD operations

### After Code Changes:
1. **Stop server**: Kill existing processes
2. **Rebuild**: `npm run build` if TypeScript changes
3. **Retest**: Run full test suite
4. **Verify**: Compare results with expected behavior

### Before Deployment:
1. **Full test suite**: All tests pass
2. **Performance check**: Response times acceptable
3. **Environment verification**: Production configurations correct
4. **Database verification**: Schema up to date

---

## 📞 Quick Reference Commands

```bash
# Quick infrastructure check
docker ps | grep sweatbot

# Quick server test
cd backend && timeout 10s node dist/server-real.js || echo "Server test completed"

# Quick health check
curl -s http://localhost:8000/health | jq .status

# Quick database test
PGPASSWORD=secure_password psql -h localhost -p 8001 -U fitness_user -d hebrew_fitness -c "SELECT 1;" && echo "PostgreSQL OK" || echo "PostgreSQL FAILED"

# Kill stuck processes
lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "No stuck processes"

# Check logs (run server in background first)
tail -f logs/sweatbot-api.log
```

---

## 📚 Related Skills

- **BACKEND_NODEJS_ARCHITECTURE.md** - Server architecture and API endpoints
- **ENVIRONMENT_SETUP.md** - Environment configuration and database setup
- **TROUBLESHOOTING.md** - Common errors and solutions
- **FRONTEND_BACKEND_COMMUNICATION.md** - API integration patterns
- **SWEATBOT_AGENT_TOOLS.md** - Agent tool testing procedures

---

## 🎯 Testing Best Practices

1. **Always test infrastructure first** - Save 10 hours debugging time
2. **Use systematic procedures** - Consistent results across sessions
3. **Document findings** - Update skills with new discoveries
4. **Test edge cases** - Not just happy path scenarios
5. **Verify persistence** - Test data survives restarts
6. **Monitor performance** - Check response times and resource usage

---

## 🎯 CRITICAL: Visual E2E Test Priority

**The Most Important Test**: The visual frontend E2E test with Playwright MCP that includes:
1. **User signup/login flow** - Verifying account creation and authentication
2. **Full conversation workflow** - Testing AI responses and exercise logging
3. **Chat history persistence** - Ensuring conversations survive browser restarts
4. **Login state persistence** - Verifying users stay logged in across sessions
5. **Contextual AI memory** - Testing that AI remembers previous workouts

**This test must pass before considering any feature complete** because:
- It's the only way to verify the complete user experience works
- It tests authentication, database persistence, and AI integration together
- It reveals issues that unit tests and API tests miss
- It's what actual users experience when using SweatBot

**If Playwright MCP is not available, Claude Code must explicitly tell you** and provide the manual testing alternative. The lack of visual E2E testing capability should be clearly communicated.

**Testing Success Means**: All health checks pass, APIs respond correctly, databases persist data, and the complete visual user workflow functions end-to-end with authentication and chat history working perfectly.

**Remember**: If tests fail, use the skills systematically to identify the root cause before making code changes. Infrastructure issues are more common than code bugs!

---