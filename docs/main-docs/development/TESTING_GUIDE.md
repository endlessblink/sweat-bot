# SweatBot Testing Guide 🧪

Complete guide to test the SweatBot Hebrew Fitness AI Tracker system.

## Quick Start Testing

### 1. Backend Testing (Essential)

```bash
# 1. Setup database and environment
cd sweatbot
python scripts/init_db.py

# 2. Start the backend
cd backend
uvicorn app.main:app --reload

# 3. Test the backend (in new terminal)
python scripts/test_backend.py
```

### 2. Docker Testing (Recommended)

```bash
# Start all services with Docker
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Frontend Testing (Optional)

```bash
# Start frontend (after backend is running)
cd frontend
npm install
npm run dev

# Visit http://localhost:3000
```

## Detailed Testing Steps

### Phase 1: Backend Verification

#### Prerequisites
- Python 3.11+
- PostgreSQL running
- Redis running (optional)

#### Step 1: Database Setup
```bash
# Initialize database and create demo user
python scripts/init_db.py
```

**Expected Output:**
```
🚀 Starting SweatBot database initialization...
✅ Database tables created/verified
✅ Demo user created successfully
🎉 Database initialization completed successfully!
```

#### Step 2: Backend Server
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
🚀 Starting SweatBot API...
✅ Database tables created/verified
✅ Background tasks started
✅ SweatBot API startup complete!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Step 3: API Testing
```bash
# Run automated tests
python scripts/test_backend.py
```

**Expected Results:**
- ✅ Health check passed
- ✅ Root endpoint passed  
- ✅ API documentation accessible
- ✅ Detailed health check passed

### Phase 2: Docker Testing

#### Prerequisites
- Docker & Docker Compose installed

#### Step 1: Environment Setup
```bash
# Ensure .env file exists with correct values
cat .env
```

#### Step 2: Start Services
```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

**Expected Services:**
- ✅ sweatbot-backend (port 8000)
- ✅ sweatbot-frontend (port 3000)  
- ✅ sweatbot-db (port 5432)
- ✅ sweatbot-redis (port 6379)

#### Step 3: Health Verification
```bash
# Test health endpoint
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "service": "sweatbot-api",
  "database": "connected",
  "websocket_connections": 0
}
```

### Phase 3: Feature Testing

#### Voice Recognition Test
1. Open browser: http://localhost:3000
2. Click microphone button
3. Say Hebrew command: "עשיתי 20 סקוואטים"
4. Verify transcription appears

#### Exercise Logging Test
```bash
# Test exercise endpoint
curl -X POST http://localhost:8000/exercises/log \
  -H "Content-Type: application/json" \
  -d '{
    "exercise_name": "squat",
    "exercise_name_he": "סקוואט",
    "reps": 20,
    "sets": 3
  }'
```

#### WebSocket Test
```bash
# Test WebSocket connection
npm install -g wscat
wscat -c ws://localhost:8000/ws
```

## Troubleshooting

### Backend Issues

#### Database Connection Error
```bash
# Error: could not connect to server
# Solution: Start PostgreSQL
sudo service postgresql start

# Or create database manually
createdb hebrew_fitness
```

#### Missing Dependencies
```bash
# Error: ModuleNotFoundError
# Solution: Install requirements
cd backend
pip install -r requirements.txt
```

#### Port Already in Use
```bash
# Error: Address already in use
# Solution: Find and kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn app.main:app --port 8001
```

### Docker Issues

#### Port Conflicts
```bash
# Error: port is already allocated
# Solution: Stop conflicting services
docker-compose down
sudo service postgresql stop
sudo service redis-server stop
```

#### Permission Errors
```bash
# Error: permission denied
# Solution: Fix permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.py
```

### Frontend Issues

#### Build Errors
```bash
# Error: Module not found
# Solution: Clean install
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### API Connection Error
```bash
# Error: Network Error
# Solution: Check backend URL in .env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testing Checklist

### ✅ Basic Functionality
- [ ] Backend starts without errors
- [ ] Health endpoint returns 200
- [ ] Database connection works
- [ ] API documentation accessible
- [ ] WebSocket connection established

### ✅ Core Features  
- [ ] User registration/login
- [ ] Exercise logging
- [ ] Hebrew voice recognition
- [ ] Real-time updates
- [ ] Gamification system

### ✅ Integration
- [ ] Frontend connects to backend
- [ ] Database queries work
- [ ] WebSocket communication
- [ ] Voice processing pipeline
- [ ] Achievement notifications

## Performance Testing

### Load Testing
```bash
# Install siege
sudo apt install siege

# Test health endpoint
siege -c 10 -t 30s http://localhost:8000/health

# Test with authentication
siege -c 5 -t 60s -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/exercises/history
```

### WebSocket Load Test
```bash
# Install ws load test tool
npm install -g websocket-bench

# Test WebSocket connections
websocket-bench -a 10 -c 100 ws://localhost:8000/ws
```

## Automated Testing

### Backend Unit Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:e2e
```

### Integration Tests
```bash
# Full system test
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Success Criteria

### Minimum Viable Test (MVP)
1. ✅ Backend health check passes
2. ✅ Database connection established
3. ✅ API documentation accessible
4. ✅ Basic endpoints respond

### Full Feature Test
1. ✅ Voice recognition working
2. ✅ Exercise logging functional
3. ✅ Real-time updates working
4. ✅ Hebrew language support
5. ✅ Gamification system active

### Production Ready
1. ✅ All tests passing
2. ✅ Load testing successful
3. ✅ Error handling robust
4. ✅ Security measures active
5. ✅ Monitoring functional

---

🎯 **Goal**: Verify SweatBot is ready for Hebrew fitness tracking with voice recognition!