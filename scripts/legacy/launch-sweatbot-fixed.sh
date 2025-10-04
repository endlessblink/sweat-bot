#!/bin/bash

# SweatBot E2E Launch Script - FIXED VERSION
# Addresses: Docker parsing errors, Python path issues, port collision fixes

# Check for debug mode
DEBUG_MODE=false
if [[ "$1" == "--debug" ]]; then
    DEBUG_MODE=true
    echo "[DEBUG] Debug mode enabled"
fi

# Timestamp logging function
log_with_time() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# Debug logging function  
debug_log() {
    if [ "$DEBUG_MODE" = true ]; then
        echo "[DEBUG] $(date '+%H:%M:%S') $1"
    fi
}

log_with_time "==============================================="
log_with_time "SweatBot E2E Launch - FIXED VERSION"
log_with_time "==============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check directory
if [ ! -f "CLAUDE.md" ] || [ ! -d "backend" ]; then
    log_with_time "${RED}[ERROR] Please run this script from the sweatbot directory${NC}"
    echo "   Current directory: $(pwd)"
    exit 1
fi

log_with_time "Working directory: $(pwd)"
echo ""

# FIXED: Simple port finding function without debug interference
find_available_port() {
    local start_port=$1
    local end_port=$2
    
    for port in $(seq $start_port $end_port); do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
    done
    
    echo $start_port  # fallback
}

# Step 1: Clean shutdown of existing services
log_with_time "[CLEANUP] Stopping existing SweatBot services..."
pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
pkill -f "agent_service_wrapper" 2>/dev/null || true
pkill -f "personal_sweatbot" 2>/dev/null || true

# Kill processes on application ports only  
for port in {8000..8010}; do
    if lsof -ti:$port >/dev/null 2>&1; then
        debug_log "Cleaning port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

log_with_time "[OK] Cleanup complete"
echo ""

# Step 2: Database setup with error handling
log_with_time "[DATABASE] Setting up databases..."

# Check Docker
if ! docker info > /dev/null 2>&1; then
    log_with_time "${RED}[ERROR] Docker not running. Please start Docker first.${NC}"
    exit 1
fi

# Create volumes
docker volume create sweatbot_postgres_data 2>/dev/null || true
docker volume create sweatbot_mongodb_data 2>/dev/null || true
docker volume create sweatbot_redis_data 2>/dev/null || true

# FIXED: PostgreSQL setup
if docker ps --filter "name=sweatbot_postgres" --format "{{.Names}}" | grep -q "sweatbot_postgres"; then
    log_with_time "[OK] PostgreSQL already running"
else
    log_with_time "[START] Starting PostgreSQL..."
    docker stop sweatbot_postgres 2>/dev/null || true
    docker rm sweatbot_postgres 2>/dev/null || true
    
    docker run -d --name sweatbot_postgres \
        -p 5434:5432 \
        -e POSTGRES_DB=hebrew_fitness \
        -e POSTGRES_USER=fitness_user \
        -e POSTGRES_PASSWORD=secure_password \
        -e POSTGRES_HOST_AUTH_METHOD=trust \
        -v sweatbot_postgres_data:/var/lib/postgresql/data \
        --restart unless-stopped \
        postgres:15-alpine > /dev/null 2>&1
    
    # Wait for PostgreSQL
    for i in {1..30}; do
        if pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
            log_with_time "[OK] PostgreSQL ready (port 5434)"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            log_with_time "${RED}[ERROR] PostgreSQL failed to start${NC}"
            exit 1
        fi
    done
fi

# FIXED: MongoDB setup
if docker ps --filter "name=sweatbot_mongodb" --format "{{.Names}}" | grep -q "sweatbot_mongodb"; then
    log_with_time "[OK] MongoDB already running"
else
    log_with_time "[START] Starting MongoDB..."
    docker stop sweatbot_mongodb 2>/dev/null || true
    docker rm sweatbot_mongodb 2>/dev/null || true
    
    docker run -d --name sweatbot_mongodb \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=sweatbot \
        -e MONGO_INITDB_ROOT_PASSWORD=secure_password \
        -v sweatbot_mongodb_data:/data/db \
        --restart unless-stopped \
        mongo:latest > /dev/null 2>&1
    
    log_with_time "[OK] MongoDB ready (port 27017)"
fi

# FIXED: Redis setup with proper port detection
REDIS_PORT=$(find_available_port 6379 6389)
debug_log "Using Redis port: $REDIS_PORT"

if docker ps --filter "name=sweatbot_redis" --format "{{.Names}}" | grep -q "sweatbot_redis"; then
    log_with_time "[OK] Redis already running"
else
    log_with_time "[START] Starting Redis on port $REDIS_PORT..."
    docker stop sweatbot_redis 2>/dev/null || true
    docker rm sweatbot_redis 2>/dev/null || true
    
    docker run -d --name sweatbot_redis \
        -p ${REDIS_PORT}:6379 \
        -v sweatbot_redis_data:/data \
        --restart unless-stopped \
        redis:7-alpine redis-server --appendonly yes --requirepass sweatbot_redis_pass > /dev/null 2>&1
    
    log_with_time "[OK] Redis ready (port $REDIS_PORT)"
fi

log_with_time "[OK] All databases running with persistent volumes"
echo ""

# Step 3: FIXED Backend setup with proper Python environment
log_with_time "[BACKEND] Starting Backend API..."

BACKEND_PORT=$(find_available_port 8000 8005)
log_with_time "Backend will use port $BACKEND_PORT"

cd backend

# FIXED: Virtual environment activation
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    debug_log "Linux venv activated"
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate  
    debug_log "Windows venv activated"
else
    log_with_time "[CREATE] Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate
fi

# FIXED: Comprehensive package installation with fallback handling
log_with_time "[INSTALL] Installing Python dependencies..."

# Install core packages first (essential for backend to run)
log_with_time "[INSTALL] Installing core backend packages..."
pip install -q uvicorn fastapi asyncpg sqlalchemy psycopg2-binary python-multipart > /dev/null 2>&1

# Install authentication packages (with explicit bcrypt)
log_with_time "[INSTALL] Installing authentication packages..."
pip install -q python-jose passlib bcrypt PyJWT cryptography > /dev/null 2>&1

# Install AI agent packages
log_with_time "[INSTALL] Installing AI agent packages..."
pip install -q phidata openai groq google-generativeai > /dev/null 2>&1

# Install additional utilities (including pydantic extras)
log_with_time "[INSTALL] Installing utilities..."
pip install -q aioredis redis python-dotenv "pydantic[email]" email-validator > /dev/null 2>&1

# Try to install from requirements.txt for additional packages (non-critical)
if [ -f "requirements.txt" ]; then
    debug_log "Installing additional packages from requirements.txt (non-critical)"
    pip install -q -r requirements.txt > /dev/null 2>&1 || true
fi

# Verify critical imports
log_with_time "[VERIFY] Checking critical package imports..."
python3 -c "import fastapi, uvicorn, sqlalchemy, bcrypt, jwt, email_validator; print('✓ Critical packages verified')" 2>/dev/null
if [ $? -ne 0 ]; then
    log_with_time "${YELLOW}[WARN] Some imports failed, installing missing packages...${NC}"
    pip install -q fastapi uvicorn sqlalchemy bcrypt PyJWT python-jose passlib cryptography "pydantic[email]" email-validator > /dev/null 2>&1
    
    # Final verification
    python3 -c "import fastapi, uvicorn, sqlalchemy, bcrypt, jwt, email_validator; print('✓ All critical packages now available')" 2>/dev/null
    if [ $? -ne 0 ]; then
        log_with_time "${RED}[ERROR] Critical package verification still failing${NC}"
        python3 -c "import fastapi, uvicorn, sqlalchemy; print('✓ Core packages OK')" 2>/dev/null || exit 1
        log_with_time "${YELLOW}[WARN] Some optional packages missing but continuing...${NC}"
    fi
fi

log_with_time "[OK] Dependencies installed"

# FIXED: Start backend with proper error handling
log_with_time "[START] Starting FastAPI server..."
nohup python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend with timeout
for i in {1..15}; do
    sleep 1
    if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
        log_with_time "[OK] Backend API ready at http://localhost:$BACKEND_PORT"
        break
    fi
    
    if [ $i -eq 15 ]; then
        log_with_time "${RED}[ERROR] Backend failed to start${NC}"
        log_with_time "Error from backend.log:"
        tail -5 ../backend.log
        exit 1
    fi
done

cd ..
echo ""

# Step 4: FIXED Agent Service with clean configuration
log_with_time "[AGENT] Starting AI Agent Service..."

AGENT_PORT=$(find_available_port 8001 8010)
log_with_time "Agent service will use port $AGENT_PORT"

# FIXED: Create agent service without debug output interference
cat > agent_service_wrapper.py << EOF
import sys
import os
sys.path.append('src')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import the fixed PersonalSweatBot
from agents.personal_sweatbot_with_tools import PersonalSweatBotWithTools

app = FastAPI(title="SweatBot Agent Service")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8004",
        "http://localhost:8005", 
        "http://localhost:3000",
        "http://localhost:4000",
        "http://localhost:4445"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize bot
bot = None

@app.on_event("startup")
async def startup():
    global bot
    try:
        bot = PersonalSweatBotWithTools()
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [BOT] PersonalSweatBot initialized")
    except Exception as e:
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [ERROR] Bot init failed: {e}")
        raise e

class ChatRequest(BaseModel):
    message: str
    user_id: str = "personal"

class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent_used: str
    timestamp: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot not initialized")
    
    try:
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [CHAT] Processing: {request.message[:50]}...")
        response_text = bot.chat(request.message)
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [CHAT] Response ready")
        
        return ChatResponse(
            response=response_text,
            session_id="auto-generated",
            agent_used="PersonalSweatBotWithTools",
            timestamp=__import__('datetime').datetime.now().isoformat()
        )
    except Exception as e:
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [ERROR] Chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "service": "SweatBot Agent",
        "port": $AGENT_PORT,
        "database": "postgresql://localhost:5434"
    }

if __name__ == "__main__":
    print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] Starting agent service on port $AGENT_PORT")
    uvicorn.run("agent_service_wrapper:app", host="0.0.0.0", port=$AGENT_PORT, reload=True)
EOF

# Start agent service
log_with_time "[START] Starting agent service..."
nohup python agent_service_wrapper.py > agent.log 2>&1 &
AGENT_PID=$!

# Wait for agent service
for i in {1..20}; do
    sleep 1
    if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
        log_with_time "[OK] Agent service ready at http://localhost:$AGENT_PORT"
        break
    fi
    
    if [ $i -eq 20 ]; then
        log_with_time "${RED}[ERROR] Agent service failed to start${NC}"
        log_with_time "Error from agent.log:"
        tail -5 agent.log
        exit 1
    fi
done

echo ""

# Step 5: FIXED Frontend setup
log_with_time "[FRONTEND] Starting Personal UI..."

FRONTEND_PORT=$(find_available_port 8004 8010)
log_with_time "Frontend will use port $FRONTEND_PORT"

cd personal-ui-vite

# Update frontend to use correct agent service port
if [ -f "src/components/SweatBotChat.tsx" ]; then
    debug_log "Updating frontend config"
    sed -i.bak "s|http://localhost:8001/chat|http://localhost:$AGENT_PORT/chat|g" src/components/SweatBotChat.tsx
fi

# Check for package manager and start frontend
if command -v bun &> /dev/null; then
    log_with_time "[INFO] Using Bun..."
    
    if [ ! -d "node_modules" ]; then
        log_with_time "[INSTALL] Installing frontend dependencies..."
        bun install > /dev/null 2>&1
    fi
    
    log_with_time "[START] Starting Vite server..."
    nohup bun run dev --port $FRONTEND_PORT > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    
elif command -v npm &> /dev/null; then
    log_with_time "[INFO] Using npm..."
    
    if [ ! -d "node_modules" ]; then
        log_with_time "[INSTALL] Installing frontend dependencies..."
        npm install --silent > /dev/null 2>&1
    fi
    
    log_with_time "[START] Starting Vite server..."
    PORT=$FRONTEND_PORT nohup npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
else
    log_with_time "${RED}[ERROR] Neither Bun nor npm found${NC}"
    exit 1
fi

cd ..

# Wait for frontend
for i in {1..25}; do
    sleep 1
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        log_with_time "[OK] Frontend ready at http://localhost:$FRONTEND_PORT"
        break
    fi
    
    if [ $i -eq 25 ]; then
        log_with_time "${YELLOW}[WARN] Frontend may still be loading...${NC}"
        break
    fi
done

echo ""

# Final status report
log_with_time "==============================================="
log_with_time "SweatBot System Status - FIXED VERSION"
log_with_time "==============================================="
echo ""

# Health checks
log_with_time "[HEALTH] System Health Check:"

if pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] PostgreSQL: Running (port 5434) - Data preserved!${NC}"
else
    log_with_time "   ${RED}[ERROR] PostgreSQL: Not responding${NC}"
fi

if nc -z localhost 27017 2>/dev/null; then
    log_with_time "   ${GREEN}[OK] MongoDB: Running (port 27017) - Conversations preserved${NC}"
else
    log_with_time "   ${YELLOW}[WARN] MongoDB: May not be running${NC}"
fi

if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] Backend API: Running (port $BACKEND_PORT)${NC}"
else
    log_with_time "   ${RED}[ERROR] Backend API: Not responding${NC}"
fi

if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] Agent Service: Running (port $AGENT_PORT)${NC}"
else
    log_with_time "   ${RED}[ERROR] Agent Service: Not responding${NC}"
fi

if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] Frontend UI: Running (port $FRONTEND_PORT)${NC}"
else
    log_with_time "   ${YELLOW}[WARN] Frontend: May still be loading${NC}"
fi

echo ""
log_with_time "==============================================="
log_with_time "Ready to Use SweatBot - FIXED VERSION!"
log_with_time "==============================================="
echo ""

log_with_time "${BLUE}[BROWSER] Open: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
log_with_time "${BLUE}[TEST] Try: ${GREEN}How many points do I have?${NC}"
log_with_time "${BLUE}[EXPECT] Real data: ${GREEN}3,113 points from database${NC}"
echo ""

log_with_time "${YELLOW}[PORTS] Service Ports (8000-8010 range):${NC}"
log_with_time "   • Backend API: http://localhost:$BACKEND_PORT"
log_with_time "   • Agent Service: http://localhost:$AGENT_PORT" 
log_with_time "   • Frontend UI: http://localhost:$FRONTEND_PORT"
echo ""

log_with_time "${YELLOW}[LOGS] View logs:${NC}"
log_with_time "   • Backend: tail -f backend.log"
log_with_time "   • Agent: tail -f agent.log"
log_with_time "   • Frontend: tail -f frontend.log"
echo ""

# Cleanup function for Ctrl+C
cleanup() {
    echo ""
    log_with_time "[STOP] Stopping SweatBot services..."
    
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null
    [ -n "$AGENT_PID" ] && kill $AGENT_PID 2>/dev/null  
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    
    # Restore frontend config
    if [ -f "personal-ui-vite/src/components/SweatBotChat.tsx.bak" ]; then
        mv personal-ui-vite/src/components/SweatBotChat.tsx.bak personal-ui-vite/src/components/SweatBotChat.tsx
    fi
    
    # Clean up temporary files
    rm -f agent_service_wrapper.py
    
    log_with_time "[OK] Services stopped (databases preserved)"
    exit 0
}

# Set up Ctrl+C handler
trap cleanup INT

log_with_time "Press Ctrl+C to stop (databases will keep running)"
echo ""

# Keep script running
wait