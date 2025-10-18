# SweatBot E2E Workflow Procedures

**Last Updated**: October 19, 2025
**Status**: ✅ **VERIFIED & OPERATIONAL**

## Overview

This document outlines the standard operating procedures for verifying and maintaining the complete end-to-end functionality of the SweatBot Hebrew fitness coaching application.

---

## 🎯 **Core E2E Workflow Verification**

### **Primary User Journey: Complete Fitness Coaching Session**

#### **Step 1: Application Launch & Authentication**
```bash
# Verify frontend loads correctly
URL: http://localhost:8005/
Expected: Hebrew interface with "SweatBot • מאמן כושר דיגיטלי" title
Authentication: Automatic guest token generation
```

**Verification Checklist:**
- [ ] Page loads with Hebrew RTL layout
- [ ] Guest user session created automatically
- [ ] WebSocket connection established (`[SweatBotChat] WebSocket connected`)
- [ ] Mobile debugger initializes without blocking UI
- [ ] Conversation history loads from MongoDB (`✅ Loaded X messages from MongoDB`)

#### **Step 2: Hebrew Input & AI Request**
```typescript
// User sends Hebrew fitness request
Input: "היי, אני רוצה להתחיל אימון היום"
Expected Flow: Frontend → Backend → GPT-4o-mini → MongoDB → WebSocket → UI Update
```

**Verification Checklist:**
- [ ] Hebrew text input accepted correctly
- [ ] Frontend sends request to `/chat/message` endpoint
- [ ] Backend processes with AIProviderService
- [ ] GPT-4o-mini generates Hebrew fitness coaching response
- [ ] Response saved to MongoDB (`✅ Message persisted to MongoDB`)
- [ ] WebSocket broadcast updates UI in real-time

#### **Step 3: AI Response Verification**
```python
# Expected AI response characteristics
Language: Hebrew (עברית)
Content: Personalized fitness recommendations
Model: openai-gpt-4o-mini
Provider: openai
Format: Structured workout plan with numbered exercises
```

**Verification Checklist:**
- [ ] AI response received in Hebrew
- [ ] Content includes structured workout plan
- [ ] Response displays properly with RTL formatting
- [ ] Console confirms: `✅ AI response from ollama/gpt-4o-mini`
- [ ] Usage metrics tracked correctly

#### **Step 4: Cross-Session Persistence**
```bash
# Verify conversation persistence
Action: Refresh browser page
Expected: Previous conversation history restored
MongoDB: Messages retrieved with same session_id
```

**Verification Checklist:**
- [ ] Conversation history persists across refreshes
- [ ] Session management maintains continuity
- [ ] MongoDB retrieval successful
- [ ] UI correctly displays historical messages
- [ ] WebSocket reconnection automatic

---

## 🔧 **Development & Testing Procedures**

### **A. System Startup Sequence**

#### **1. Infrastructure Health Check**
```bash
# Check Docker containers
cd config/docker && docker ps
Expected: sweatbot_postgres, sweatbot_mongodb, sweatbot_redis all running

# Verify database connectivity
docker exec sweatbot_mongodb mongosh --quiet --eval "db.adminCommand('ping')"
docker exec sweatbot_postgres pg_isready -U postgres
```

#### **2. Backend Service Launch**
```bash
# Start with Doppler secrets
cd backend && doppler run --project sweatbot --config dev -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Health verification
curl http://localhost:8000/health/detailed
Expected: All services healthy, AI providers configured
```

#### **3. Frontend Service Launch**
```bash
# Start Vite dev server
cd personal-ui-vite && doppler run --project sweatbot --config dev -- npm run dev
Expected: Development server at http://localhost:8005/
```

### **B. E2E Testing Procedures**

#### **1. Automated Browser Testing (Playwright)**
```typescript
// Run complete user journey test
npx playwright test tests/e2e/complete-user-journey.spec.ts --headed

// Hebrew chat functionality test
npx playwright test "hebrew-chat-test.spec.ts" --headed
```

**Test Coverage Requirements:**
- [ ] Hebrew input handling
- [ ] AI response processing
- [ ] WebSocket communication
- [ ] Data persistence verification
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verification

#### **2. Manual Verification Protocol**

**Desktop Testing:**
```bash
Browser: Chrome/Chromium
URL: http://localhost:8005/
Tests: Complete conversation flow, Hebrew input, AI responses
```

**Mobile Testing:**
```bash
Method: Browser DevTools mobile simulation
Tests: Touch interactions, voice input, responsive layout
Verification: Hebrew text rendering, mobile chat interface
```

**Cross-browser Verification:**
```bash
Browsers: Chrome, Firefox, Safari, Edge
Tests: Basic functionality, WebSocket connections, AI integration
Expected: Consistent behavior across all browsers
```

---

## 🚨 **Troubleshooting SOP**

### **A. Common Issues & Resolution**

#### **Issue 1: WebSocket Connection Failure**
**Symptoms:**
- Console shows: `WebSocket connection failed`
- No real-time message updates
- `[SweatBotChat] WebSocket connection error`

**Resolution Steps:**
```bash
1. Check backend service: curl http://localhost:8000/health
2. Verify port availability: lsof -ti:8000
3. Kill conflicting processes: lsof -ti:8000 | xargs kill -9
4. Restart backend service
5. Clear browser cache and reload
```

#### **Issue 2: AI Integration Problems**
**Symptoms:**
- No AI responses received
- Console shows: `AI CLIENT Response status: 500`
- Hebrew input not processed

**Resolution Steps:**
```bash
1. Verify Doppler secrets: doppler secrets list
2. Check API keys: doppler run -- env | grep -E "(OPENAI|GROQ|GEMINI)"
3. Test AI provider backend: curl -X POST http://localhost:8000/api/v1/chat/test
4. Check AIProviderService logs for provider initialization
5. Verify GPT-4o-mini model availability
```

#### **Issue 3: Mobile Debug Overlay Blocking UI**
**Symptoms:**
- Mobile debug overlay visible on screen
- UI elements not clickable
- Touch interactions blocked

**Resolution Steps:**
```bash
1. Check App.tsx for mobile debugger import
2. Comment out: // import './utils/mobileDebugger';
3. Restart frontend service
4. Verify UI elements are interactive
5. Test touch functionality
```

#### **Issue 4: Database Connection Issues**
**Symptoms:**
- Messages not persisting
- Console shows MongoDB connection errors
- Conversation history lost on refresh

**Resolution Steps:**
```bash
1. Check Docker containers: docker ps -a | grep sweatbot
2. Restart database services: cd config/docker && doppler run -- docker-compose up -d
3. Verify connectivity:
   - MongoDB: docker exec sweatbot_mongodb mongosh --eval "db.adminCommand('ping')"
   - PostgreSQL: docker exec sweatbot_postgres pg_isready
4. Check database logs: docker logs sweatbot_mongodb
5. Restart backend service after database recovery
```

### **B. Performance Optimization Procedures**

#### **Frontend Performance**
```bash
# Monitor bundle size
cd personal-ui-vite && npm run build -- --analyze

# Check Vite dev server performance
Expected: <2 seconds initial load
<1 second subsequent loads
```

#### **Backend Performance**
```bash
# Monitor AI response times
Expected: 3-5 seconds for GPT-4o-mini responses
<100ms WebSocket latency
<50ms database operations

# Test under load
Use: k6 or similar load testing tool
Target: 10+ concurrent users
```

---

## 🔐 **Security Verification Procedures**

### **A. API Security Verification**
```bash
# Verify no API keys in frontend
grep -r -i "sk-" personal-ui-vite/src/
Expected: No matches found

# Check backend proxy pattern
Verify: All AI requests go through backend, not direct to AI providers
```

### **B. Authentication Testing**
```bash
# Test guest token generation
Visit: http://localhost:8005/
Expected: Automatic guest session created

# Verify JWT token format
Check browser localStorage for auth tokens
Expected: Valid JWT tokens with proper expiration
```

### **C. Data Validation**
```bash
# Test Hebrew input handling
Input: "היי, אני רוצה להתחיל אימון היום"
Expected: Proper UTF-8 encoding, correct display

# Verify database storage
Check MongoDB for Hebrew text storage
Expected: Proper UTF-8 encoding in database
```

---

## 📊 **Monitoring & Maintenance**

### **A. Daily Health Checks**
```bash
# Service Health Dashboard
curl http://localhost:8000/health/detailed
Expected: All systems healthy, AI providers available

# Database Status
docker exec sweatbot_mongodb mongosh --eval "db.stats()"
docker exec sweatbot_postgres pg_isready -U postgres
Expected: All databases responsive
```

### **B. Performance Monitoring**
```bash
# Response Time Tracking
Monitor: AI response times, WebSocket latency, database queries
Alert Threshold: >10 seconds for AI responses, >1 second for WebSocket

# Error Rate Monitoring
Track: Failed AI requests, WebSocket disconnections, database errors
Alert Threshold: >5% error rate for any service
```

### **C. Usage Analytics**
```bash
# Active Session Tracking
Monitor: Concurrent WebSocket connections
Expected: Proper session management, no memory leaks

# AI Usage Monitoring
Track: Token usage, cost tracking, provider performance
Expected: Efficient GPT-4o-mini usage with fallback when needed
```

---

## 🔄 **Deployment Procedures**

### **A. Pre-deployment Verification**
```bash
# Complete E2E Test Suite
npx playwright test
Expected: All tests passing

# Security Audit
Check: No hardcoded secrets, proper authentication, data validation
Expected: Security best practices implemented
```

### **B. Production Deployment**
```bash
# Environment Setup
doppler setup --project sweatbot --config prd
doppler secrets upload .env.production

# Service Deployment
git push origin main  # Triggers automatic deployment
Expected: Zero-downtime deployment with health checks
```

### **C. Post-deployment Verification**
```bash
# Production Health Check
curl https://production-url.com/health/detailed
Expected: All systems operational

# User Journey Testing
Test: Complete conversation flow in production
Expected: Same functionality as development environment
```

---

## 📋 **Quality Assurance Checklist**

### **Before Every Release:**
- [ ] E2E tests passing (Playwright)
- [ ] Manual browser testing completed
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Hebrew language support verified
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Documentation updated

### **After Every Deployment:**
- [ ] Production health checks passed
- [ ] User journey testing completed
- [ ] Monitoring systems operational
- [ ] Error rates within acceptable limits
- [ ] User feedback collected and analyzed

---

## 🎯 **Success Metrics**

### **Technical KPIs**
- **Uptime**: >99.5%
- **Response Time**: <5 seconds for AI responses
- **Error Rate**: <1% for critical functions
- **WebSocket Success Rate**: >99%
- **Cross-browser Compatibility**: 100%

### **User Experience KPIs**
- **Session Success Rate**: >95%
- **Hebrew Support**: 100% functional
- **Mobile Usability**: Optimized for all devices
- **Conversation Persistence**: 100% reliable
- **AI Response Quality**: Consistent, helpful fitness coaching

---

## 📞 **Escalation Procedures**

### **Critical Issues (P0)**
- **Complete system outage**
- **Data loss or corruption**
- **Security breach**

**Response Time**: 15 minutes
**Escalation**: Immediate notification to all stakeholders

### **High Priority Issues (P1)**
- **AI service degradation**
- **Database connectivity issues**
- **WebSocket connection failures**

**Response Time**: 1 hour
**Resolution**: 4 hours

### **Medium Priority Issues (P2)**
- **Performance degradation**
- **Cross-browser compatibility issues**
- **UI/UX problems**

**Response Time**: 4 hours
**Resolution**: 24 hours

---

**Document Status**: ✅ **ACTIVE & VERIFIED**
**Last Review**: October 19, 2025
**Next Review**: November 19, 2025

---

*This SOP document reflects the current operational procedures for SweatBot E2E functionality. For system architecture details, refer to `.agent/system/current-architecture-status.md`. For development guidelines, refer to `.agent/system/agents-architecture.md`.*