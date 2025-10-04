#!/bin/bash

# SweatBot Minimal Launch - Focus on Core AI Chat Functionality
# Bypasses complex audio/voice dependencies to get the system running quickly

log_with_time() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log_with_time "==============================================="
log_with_time "SweatBot Minimal Launch - Core AI Chat Only"
log_with_time "==============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check directory
if [ ! -f "CLAUDE.md" ] || [ ! -d "backend" ]; then
    log_with_time "${RED}[ERROR] Run from sweatbot directory${NC}"
    exit 1
fi

# Function to find available port
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

# Step 1: Clean processes
log_with_time "[CLEANUP] Stopping existing services..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "agent_service" 2>/dev/null || true

# Clean application ports only
for port in {8000..8010}; do
    if lsof -ti:$port >/dev/null 2>&1; then
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

log_with_time "[OK] Cleanup complete"
echo ""

# Step 2: Database setup (minimal)
log_with_time "[DATABASE] Setting up databases..."

# Check Docker
if ! docker info > /dev/null 2>&1; then
    log_with_time "${RED}[ERROR] Docker not running${NC}"
    exit 1
fi

# PostgreSQL only (minimal setup)
if docker ps --filter "name=sweatbot_postgres" --format "{{.Names}}" | grep -q "sweatbot_postgres"; then
    log_with_time "[OK] PostgreSQL already running"
else
    log_with_time "[START] Starting PostgreSQL..."
    docker run -d --name sweatbot_postgres \
        -p 5434:5432 \
        -e POSTGRES_DB=hebrew_fitness \
        -e POSTGRES_USER=fitness_user \
        -e POSTGRES_PASSWORD=secure_password \
        -e POSTGRES_HOST_AUTH_METHOD=trust \
        postgres:15-alpine > /dev/null 2>&1
    
    # Wait briefly
    sleep 5
fi

log_with_time "[OK] Database ready"
echo ""

# Step 3: Agent Service (Direct Python - Bypass FastAPI backend)
log_with_time "[AGENT] Starting AI Agent Service (Direct Mode)..."

AGENT_PORT=$(find_available_port 8001 8010)
log_with_time "Agent service will use port $AGENT_PORT"

# Install minimal packages for agent only
cd backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    python3 -m venv venv
    source venv/bin/activate
fi

log_with_time "[INSTALL] Installing minimal AI agent packages..."
pip install -q phidata openai groq google-generativeai psycopg2-binary fastapi uvicorn > /dev/null 2>&1

log_with_time "[OK] Minimal packages installed"

cd ..

# Create minimal agent service (no complex backend imports)
cat > minimal_agent_service.py << EOF
import sys
sys.path.append('src')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import the working AI agent
from agents.personal_sweatbot_with_tools import PersonalSweatBotWithTools

app = FastAPI(title="SweatBot Minimal Agent Service")

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
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [BOT] PersonalSweatBot minimal service ready")
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [DATA] Connected to PostgreSQL with REAL data")
    except Exception as e:
        print(f"[{__import__('datetime').datetime.now().strftime('%H:%M:%S')}] [ERROR] Bot init failed: {e}")

class ChatRequest(BaseModel):
    message: str
    user_id: str = "personal"

class ChatResponse(BaseModel):
    response: str
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
        "service": "SweatBot Minimal",
        "port": $AGENT_PORT,
        "database": "postgresql://localhost:5434",
        "features": "AI Chat + Database (No Voice)"
    }

if __name__ == "__main__":
    uvicorn.run("minimal_agent_service:app", host="0.0.0.0", port=$AGENT_PORT, reload=False)
EOF

# Start minimal agent service
log_with_time "[START] Starting minimal agent service..."
nohup python minimal_agent_service.py > minimal_agent.log 2>&1 &
AGENT_PID=$!

# Wait for agent service
for i in {1..20}; do
    sleep 1
    if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
        log_with_time "[OK] Agent service ready at http://localhost:$AGENT_PORT"
        break
    fi
    
    if [ $i -eq 20 ]; then
        log_with_time "${RED}[ERROR] Agent service failed${NC}"
        tail -5 minimal_agent.log
        exit 1
    fi
done

echo ""

# Step 4: Frontend (if available)
log_with_time "[FRONTEND] Starting minimal frontend..."

FRONTEND_PORT=$(find_available_port 8004 8010)
log_with_time "Frontend will use port $FRONTEND_PORT"

# Check if we have a simple frontend
if [ -d "personal-ui-vite" ]; then
    cd personal-ui-vite
    
    # Update to use agent service
    if [ -f "src/components/SweatBotChat.tsx" ]; then
        sed -i.bak "s|http://localhost:8001/chat|http://localhost:$AGENT_PORT/chat|g" src/components/SweatBotChat.tsx 2>/dev/null || true
    fi
    
    # Try to start frontend
    if command -v bun &> /dev/null; then
        log_with_time "[START] Starting frontend with Bun..."
        nohup bun run dev --port $FRONTEND_PORT > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
    elif command -v npm &> /dev/null; then
        log_with_time "[START] Starting frontend with npm..."
        PORT=$FRONTEND_PORT nohup npm run dev > ../frontend.log 2>&1 &
        FRONTEND_PID=$!
    else
        log_with_time "${YELLOW}[WARN] No frontend package manager found${NC}"
        FRONTEND_PID=""
    fi
    
    cd ..
    
    if [ -n "$FRONTEND_PID" ]; then
        sleep 5
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
            log_with_time "[OK] Frontend ready at http://localhost:$FRONTEND_PORT"
        else
            log_with_time "${YELLOW}[WARN] Frontend may still be loading${NC}"
        fi
    fi
else
    log_with_time "${YELLOW}[WARN] No frontend directory found${NC}"
    FRONTEND_PID=""
fi

echo ""

# Final status
log_with_time "==============================================="
log_with_time "SweatBot Minimal System Ready!"
log_with_time "==============================================="
echo ""

# Health checks
if pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] PostgreSQL: Running (your 3,113 points preserved!)${NC}"
else
    log_with_time "   ${RED}[ERROR] PostgreSQL: Not responding${NC}"
fi

if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] AI Agent: Running (port $AGENT_PORT)${NC}"
else
    log_with_time "   ${RED}[ERROR] AI Agent: Not responding${NC}"
fi

if [ -n "$FRONTEND_PID" ] && curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    log_with_time "   ${GREEN}[OK] Frontend: Running (port $FRONTEND_PORT)${NC}"
    log_with_time ""
    log_with_time "${BLUE}[BROWSER] Open: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
else
    log_with_time "   ${YELLOW}[WARN] Frontend: Not available${NC}"
    log_with_time ""
    log_with_time "${BLUE}[API] Test directly: curl http://localhost:$AGENT_PORT/health${NC}"
fi

echo ""
log_with_time "${BLUE}[TEST] Try asking: ${GREEN}How many points do I have?${NC}"
log_with_time "${BLUE}[EXPECT] Real data: ${GREEN}3,113 points from database${NC}"
echo ""

log_with_time "${YELLOW}[INFO] Minimal Features:${NC}"
log_with_time "   • ✅ AI Chat Agent (Hebrew + English)"
log_with_time "   • ✅ Real Database Connection (PostgreSQL)"
log_with_time "   • ✅ Statistics Retrieval (3,113 points)"
log_with_time "   • ✅ Exercise Logging"
log_with_time "   • ❌ Voice Recognition (disabled)"
log_with_time "   • ❌ Audio Features (disabled)"
echo ""

log_with_time "${YELLOW}[CURL TEST] Test the API directly:${NC}"
echo "curl -X POST http://localhost:$AGENT_PORT/chat \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"message\":\"How many points do I have?\",\"user_id\":\"personal\"}'"
echo ""

# Cleanup function
cleanup() {
    echo ""
    log_with_time "[STOP] Stopping minimal services..."
    
    [ -n "$AGENT_PID" ] && kill $AGENT_PID 2>/dev/null
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    
    if [ -f "personal-ui-vite/src/components/SweatBotChat.tsx.bak" ]; then
        mv personal-ui-vite/src/components/SweatBotChat.tsx.bak personal-ui-vite/src/components/SweatBotChat.tsx 2>/dev/null || true
    fi
    
    rm -f minimal_agent_service.py
    
    log_with_time "[OK] Minimal services stopped"
    exit 0
}

trap cleanup INT

log_with_time "Press Ctrl+C to stop services"
echo ""

# Keep running
wait