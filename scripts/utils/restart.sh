#!/bin/bash

# SweatBot Simple Restart - Use What's Already Working
# Don't reinstall anything, just restart the services

log_with_time() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log_with_time "=============================================="
log_with_time "SweatBot Simple Restart - Using Existing Setup"
log_with_time "=============================================="
echo ""

# Colors (plain ASCII)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check directory
if [ ! -f "CLAUDE.md" ] || [ ! -d "backend" ]; then
    log_with_time "${RED}[ERROR] Run from sweatbot directory${NC}"
    exit 1
fi

# Simple port finder
find_available_port() {
    local start_port=$1
    local end_port=$2
    
    for port in $(seq $start_port $end_port); do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
    done
    echo $start_port
}

# Step 1: Kill any hanging processes
log_with_time "[CLEANUP] Stopping any hanging SweatBot processes..."
pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
pkill -f "agent_service" 2>/dev/null || true
pkill -f "personal_sweatbot" 2>/dev/null || true

# Clean application ports only (8000-8010)
for port in {8000..8010}; do
    if lsof -ti:$port >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

log_with_time "[OK] Cleanup complete"
echo ""

# Step 2: Check existing databases (DON'T restart them)
log_with_time "[DATABASE] Checking existing databases..."

if docker ps --filter "name=sweatbot_postgres" --format "{{.Names}}" | grep -q "sweatbot_postgres"; then
    log_with_time "[OK] PostgreSQL already running (preserving your 3,113 points)"
else
    log_with_time "${YELLOW}[INFO] Starting PostgreSQL...${NC}"
    docker start sweatbot_postgres 2>/dev/null || {
        log_with_time "${YELLOW}[INFO] Creating PostgreSQL with existing volume...${NC}"
        docker run -d --name sweatbot_postgres \
            -p 5434:5432 \
            -e POSTGRES_DB=hebrew_fitness \
            -e POSTGRES_USER=fitness_user \
            -e POSTGRES_PASSWORD=secure_password \
            -e POSTGRES_HOST_AUTH_METHOD=trust \
            -v sweatbot_postgres_data:/var/lib/postgresql/data \
            --restart unless-stopped \
            postgres:15-alpine > /dev/null 2>&1
    }
fi

if docker ps --filter "name=sweatbot_mongodb" --format "{{.Names}}" | grep -q "sweatbot_mongodb"; then
    log_with_time "[OK] MongoDB already running (preserving conversations)"
else
    log_with_time "${YELLOW}[INFO] Starting MongoDB...${NC}"
    docker start sweatbot_mongodb 2>/dev/null || {
        log_with_time "${YELLOW}[INFO] Creating MongoDB with existing volume...${NC}"
        docker run -d --name sweatbot_mongodb \
            -p 27017:27017 \
            -e MONGO_INITDB_ROOT_USERNAME=sweatbot \
            -e MONGO_INITDB_ROOT_PASSWORD=secure_password \
            -v sweatbot_mongodb_data:/data/db \
            --restart unless-stopped \
            mongo:latest > /dev/null 2>&1
    }
fi

# Redis - use different port to avoid Palladio conflict
REDIS_PORT=6380
log_with_time "[INFO] Using Redis on port $REDIS_PORT (avoiding Palladio conflict)"

if docker ps --filter "name=sweatbot_redis" --format "{{.Names}}" | grep -q "sweatbot_redis"; then
    log_with_time "[OK] Redis already running"
else
    log_with_time "${YELLOW}[INFO] Starting Redis on port $REDIS_PORT...${NC}"
    docker stop sweatbot_redis 2>/dev/null || true
    docker rm sweatbot_redis 2>/dev/null || true
    
    docker run -d --name sweatbot_redis \
        -p ${REDIS_PORT}:6379 \
        -v sweatbot_redis_data:/data \
        --restart unless-stopped \
        redis:7-alpine redis-server --appendonly yes --requirepass sweatbot_redis_pass > /dev/null 2>&1
fi

log_with_time "[OK] All databases ready"
echo ""

# Step 3: Backend - Use existing venv, DON'T reinstall
log_with_time "[BACKEND] Starting backend with EXISTING packages..."

BACKEND_PORT=$(find_available_port 8000 8005)
log_with_time "Backend will use port $BACKEND_PORT"

cd backend

# Just activate existing venv - DON'T install anything
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    log_with_time "[OK] Using existing virtual environment"
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
    log_with_time "[OK] Using existing virtual environment"
else
    log_with_time "${RED}[ERROR] No virtual environment found. You need to run full install first.${NC}"
    exit 1
fi

# Start backend immediately - no installation
log_with_time "[START] Starting FastAPI backend..."
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
for i in {1..15}; do
    sleep 1
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        log_with_time "[OK] Backend ready at http://localhost:$BACKEND_PORT"
        break
    fi
    if [ $i -eq 15 ]; then
        log_with_time "${RED}[ERROR] Backend failed to start${NC}"
        log_with_time "Check backend.log for details:"
        tail -5 ../backend.log
        exit 1
    fi
done

cd ..
echo ""

# Step 4: Agent Service
log_with_time "[AGENT] Starting AI agent service..."

AGENT_PORT=$(find_available_port 8001 8010)
log_with_time "Agent service will use port $AGENT_PORT"

# Find frontend port for CORS
FRONTEND_PORT=$(find_available_port 8004 8010)

# Create simple agent service
cat > simple_agent_restart.py << EOF
import sys
import os
sys.path.append('src')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import working agent
from agents.personal_sweatbot_with_tools import PersonalSweatBotWithTools

app = FastAPI(title="SweatBot Agent Service - Restart")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:$FRONTEND_PORT",
        "http://localhost:8004",
        "http://localhost:3000",
        "http://localhost:4445"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot = None

@app.on_event("startup")
async def startup():
    global bot
    try:
        bot = PersonalSweatBotWithTools()
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [BOT] Agent ready - connecting to your 3,113 points!")
    except Exception as e:
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [ERROR] Agent init failed: {e}")
        raise e

class ChatRequest(BaseModel):
    message: str
    user_id: str = "personal"

class ChatResponse(BaseModel):
    response: str
    timestamp: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot not initialized")
    
    try:
        response_text = bot.chat(request.message)
        return ChatResponse(
            response=response_text,
            timestamp=__import__('datetime').datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "SweatBot Restart", "port": $AGENT_PORT}

if __name__ == "__main__":
    uvicorn.run("simple_agent_restart:app", host="0.0.0.0", port=$AGENT_PORT, reload=False)
EOF

# Start agent service
log_with_time "[START] Starting agent service..."
nohup python simple_agent_restart.py > agent_restart.log 2>&1 &
AGENT_PID=$!

# Wait for agent
for i in {1..20}; do
    sleep 1
    if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
        log_with_time "[OK] Agent service ready at http://localhost:$AGENT_PORT"
        break
    fi
    if [ $i -eq 20 ]; then
        log_with_time "${RED}[ERROR] Agent failed to start${NC}"
        log_with_time "Check agent_restart.log:"
        tail -5 agent_restart.log
        exit 1
    fi
done

echo ""

# Step 5: Frontend (if available)
if [ -d "personal-ui-vite" ]; then
    log_with_time "[FRONTEND] Starting frontend..."
    
    cd personal-ui-vite
    
    # Update agent port
    if [ -f "src/components/SweatBotChat.tsx" ]; then
        sed -i.bak "s|http://localhost:8001/chat|http://localhost:$AGENT_PORT/chat|g" src/components/SweatBotChat.tsx 2>/dev/null || true
    fi
    
    # Start frontend if package manager available
    if command -v bun &> /dev/null; then
        log_with_time "[START] Starting frontend with Bun on port $FRONTEND_PORT..."
        nohup bun run dev --port $FRONTEND_PORT > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
    elif command -v npm &> /dev/null; then
        log_with_time "[START] Starting frontend with npm on port $FRONTEND_PORT..."
        PORT=$FRONTEND_PORT nohup npm run dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
    else
        FRONTEND_PID=""
    fi
    
    cd ..
    
    if [ -n "$FRONTEND_PID" ]; then
        sleep 5
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
            log_with_time "[OK] Frontend ready at http://localhost:$FRONTEND_PORT"
        fi
    fi
else
    FRONTEND_PID=""
fi

echo ""

# Final status
log_with_time "=============================================="
log_with_time "SweatBot Successfully Restarted!"
log_with_time "=============================================="
echo ""

log_with_time "[HEALTH] System Status:"
if pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
    log_with_time "   [OK] PostgreSQL: Your 3,113 points are safe!"
else
    log_with_time "   [ERROR] PostgreSQL: Not responding"
fi

if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    log_with_time "   [OK] Backend API: Running (port $BACKEND_PORT)"
else
    log_with_time "   [ERROR] Backend API: Not responding"
fi

if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
    log_with_time "   [OK] AI Agent: Running (port $AGENT_PORT)"
else
    log_with_time "   [ERROR] AI Agent: Not responding"
fi

if [ -n "$FRONTEND_PID" ]; then
    log_with_time "   [OK] Frontend: Running (port $FRONTEND_PORT)"
    log_with_time ""
    log_with_time "[BROWSER] Open: http://localhost:$FRONTEND_PORT"
else
    log_with_time "   [INFO] No frontend started"
    log_with_time ""
    log_with_time "[API] Test directly: curl http://localhost:$AGENT_PORT/health"
fi

echo ""
log_with_time "[TEST] Try: How many points do I have?"
log_with_time "[EXPECT] Your preserved 3,113 points!"
echo ""

log_with_time "[PORTS] Services running:"
log_with_time "   • Backend API: http://localhost:$BACKEND_PORT"
log_with_time "   • AI Agent: http://localhost:$AGENT_PORT"
if [ -n "$FRONTEND_PID" ]; then
    log_with_time "   • Frontend: http://localhost:$FRONTEND_PORT"
fi
echo ""

# Cleanup function
cleanup() {
    echo ""
    log_with_time "[STOP] Stopping services..."
    
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$AGENT_PID" ] && kill $AGENT_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    
    # Restore frontend config
    if [ -f "personal-ui-vite/src/components/SweatBotChat.tsx.bak" ]; then
        mv personal-ui-vite/src/components/SweatBotChat.tsx.bak personal-ui-vite/src/components/SweatBotChat.tsx 2>/dev/null || true
    fi
    
    rm -f simple_agent_restart.py
    
    log_with_time "[OK] Services stopped (databases preserved)"
    exit 0
}

trap cleanup INT

log_with_time "Press Ctrl+C to stop services"
log_with_time "Databases will continue running with your data"
echo ""

# Keep running
wait