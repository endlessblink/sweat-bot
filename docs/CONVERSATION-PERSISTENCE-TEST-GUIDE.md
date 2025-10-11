# 🧪 Conversation Persistence Testing Guide

## ⚠️ CRITICAL TESTING REQUIREMENT

**Per CLAUDE.md:** Never claim functionality works without ACTUAL E2E testing using real user interactions in the browser.

---

## 📋 Manual Testing Checklist

### Test 1: Basic Message Persistence

**Steps:**
1. Open http://localhost:8007 in browser
2. Open browser DevTools (F12) → Console tab
3. Send message: "שלום"
4. Check console for: `✅ Message persisted to MongoDB: session_20250xxx`
5. Send message: "עשיתי 20 סקוואטים"
6. Check console for same session ID
7. **Verify:** Same session ID for both messages

**Expected Console Output:**
```
✅ Message persisted to MongoDB: session_20251011_154500
```

**Verify in MongoDB:**
```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "db.conversations.find().pretty()"'
```

**Expected:** Should see 2 messages saved with correct roles and content.

---

### Test 2: Page Refresh - Conversation Restoration

**Steps:**
1. Send 3 messages in chat
2. Verify all appear in chat history
3. **Refresh the page (F5 or Ctrl+R)**
4. Check console for: `✅ Loaded X messages from MongoDB (session: ...)`
5. **Verify:** All 3 messages reappear in chat interface
6. Send another message
7. **Verify:** New message appends to same session

**Expected Console Output:**
```
ℹ️ No previous conversation history found - starting fresh
# OR (if messages exist):
✅ Loaded 3 messages from MongoDB (session: session_20251011_154500)
   Total messages in session: 3
```

**✅ PASS CRITERIA:** All messages appear after refresh
**❌ FAIL CRITERIA:** Empty chat after refresh

---

### Test 3: MongoDB Persistence Verification

**Steps:**
1. Send 5 different messages in chat
2. Run MongoDB query directly:

```bash
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "
  db.conversations.find({}).forEach(function(session) {
    print(\"=== Session: \" + session.session_id + \" ===\");
    print(\"Messages: \" + session.messages.length);
    session.messages.forEach(function(msg) {
      print(\"  [\" + msg.role + \"]: \" + msg.content.substring(0, 50));
    });
  });
"'
```

**Expected Output:**
```
=== Session: session_20251011_154500 ===
Messages: 5
  [user]: שלום
  [assistant]: שלום! איך אני יכול לעזור לך היום?
  [user]: עשיתי 20 סקוואטים
  [assistant]: רשמתי לך: סקוואטים - 20 חזרות! כל הכבוד! 💪
  [user]: כמה נקודות יש לי?
```

**✅ PASS CRITERIA:** All messages saved with correct roles
**❌ FAIL CRITERIA:** Messages missing or corrupted

---

### Test 4: Offline Fallback

**Steps:**
1. Stop the backend: `pkill -f uvicorn`
2. Send message in browser: "test message"
3. Check console for: `⚠️ MongoDB persistence failed (offline?), message saved locally`
4. **Verify:** Message still appears in chat interface
5. Restart backend: `cd backend && doppler run -- python -m uvicorn app.main:app --reload`
6. Send another message
7. **Verify:** New message persists to MongoDB

**Expected Behavior:**
- Messages work even when backend is down
- Conversation continues locally
- Persistence resumes when backend comes back

**✅ PASS CRITERIA:** Chat continues working offline
**❌ FAIL CRITERIA:** Error message or chat stops working

---

### Test 5: Multiple Sessions

**Steps:**
1. Have a conversation with 5 messages
2. Clear browser cache (Ctrl+Shift+Delete → Cookies and site data)
3. Reload page (starts new session)
4. Send a new message
5. Query MongoDB:

```bash
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "db.conversations.countDocuments({})"'
```

**Expected:** Should show 2 (or more) separate session documents

**Test API Endpoint:**
```bash
curl -H "Authorization: Bearer $(cat .guest-token)" \
  http://localhost:8000/api/memory/sessions | python3 -m json.tool
```

**Expected Output:**
```json
{
  "sessions": [
    {
      "session_id": "session_20251011_160000",
      "created_at": "...",
      "updated_at": "...",
      "message_count": 1,
      "preview": "new message after cache clear"
    },
    {
      "session_id": "session_20251011_154500",
      "created_at": "...",
      "updated_at": "...",
      "message_count": 5,
      "preview": "שלום"
    }
  ]
}
```

---

### Test 6: Session Continuity

**Steps:**
1. Send message: "שלום"
2. Note the session ID from console
3. Send message: "מה שלומך?"
4. **Verify:** Same session ID in console
5. Wait 1 minute
6. Send message: "עשיתי אימון"
7. **Verify:** STILL same session ID (no timeout)

**Expected:** All messages in same session regardless of time gaps

---

## 🔍 Debugging Commands

### View All Conversations

```bash
cd /mnt/d/MY\ PROJECTS/AI/LLM/AI\ Code\ Gen/my-builds/Automation-Bots/sweatbot

# Pretty print all conversations
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "db.conversations.find().pretty()"'

# Count total conversations
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "db.conversations.countDocuments({})"'

# Get conversation stats
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "
  db.conversations.aggregate([
    {
      \$project: {
        session_id: 1,
        message_count: { \$size: \"\$messages\" },
        created_at: 1
      }
    }
  ]).forEach(printjson);
"'
```

### Clear All Conversations (Reset for Testing)

```bash
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "db.conversations.deleteMany({})"'
```

### Test API Endpoints Directly

```bash
# Get conversation context
curl -H "Authorization: Bearer $(cat .guest-token)" \
  "http://localhost:8000/api/memory/context/personal?limit=20" | python3 -m json.tool

# Get conversation stats
curl -H "Authorization: Bearer $(cat .guest-token)" \
  "http://localhost:8000/api/memory/stats/personal" | python3 -m json.tool

# List sessions
curl -H "Authorization: Bearer $(cat .guest-token)" \
  "http://localhost:8000/api/memory/sessions" | python3 -m json.tool
```

---

## ✅ Success Criteria

Conversation persistence is considered **WORKING** only if ALL of the following pass:

1. ✅ Messages save to MongoDB (verified in DB)
2. ✅ Session ID persists across multiple messages
3. ✅ Page refresh loads previous conversation
4. ✅ New messages append to existing session
5. ✅ Offline fallback works (local cache)
6. ✅ Console shows persistence confirmations
7. ✅ Multiple sessions can coexist

---

## 🚨 Common Issues & Solutions

### Issue: "Failed to persist message" in console

**Cause:** Backend not running or MongoDB connection failed

**Fix:**
```bash
# Restart backend with Doppler
cd backend
doppler run -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Issue: "ℹ️ No previous conversation history found" after refresh

**Possible Causes:**
1. Different user ID after refresh
2. MongoDB not persisting
3. Session cleared from DB

**Debug:**
```bash
# Check if conversations exist in MongoDB
doppler run -- bash -c 'docker exec sweatbot_mongodb mongosh "mongodb://sweatbot:$MONGODB_PASSWORD@localhost:27017/sweatbot_conversations" --quiet --eval "db.conversations.countDocuments({})"'
```

### Issue: Messages appear twice or duplicated

**Cause:** Multiple save calls or race condition

**Fix:** Check console for duplicate "Message persisted" logs

---

## 📊 Performance Testing

### Test 7: Large Conversation

**Steps:**
1. Send 50 messages in succession
2. Measure load time on refresh
3. **Expected:** <2 seconds to load 50 messages

### Test 8: Concurrent Users

**Steps:**
1. Open 3 browser tabs
2. Send messages from each tab simultaneously
3. **Verify:** Each tab has separate session ID
4. **Verify:** No cross-contamination of messages

---

## 🎯 Next Steps After Testing

Once all tests pass:
1. ✅ Mark TASK-93966 as complete
2. Move to Phase 3: Performance Optimization
3. Or move to Phase 1.1: Backend AI Proxy (critical security)

**Current Implementation Status:**
- ✅ Code implemented
- ⏳ Manual testing required
- ⏳ Automated E2E tests needed (future)

