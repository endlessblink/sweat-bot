#!/bin/bash

# SweatBot Hebrew Fitness AI Tracker - Auto-Port Startup Script
# Automatically finds available ports and starts the application

echo "================================================"
echo "🚀 SweatBot Hebrew Fitness AI Tracker"
echo "   Auto-Port Detection Enabled"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the sweatbot directory${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    
    # Kill backend process
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    
    # Kill frontend process
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    # Also kill by port if PIDs are lost
    if [ ! -z "$BACKEND_PORT" ]; then
        lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PORT" ]; then
        lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null
    fi
    
    # Clean up frontend env file
    rm -f frontend/.env.local 2>/dev/null
    
    echo "Services stopped."
    exit 0
}

# Set up trap for cleanup on exit
trap cleanup INT TERM EXIT

# Check Python
echo "🔍 Checking dependencies..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ first"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 16+ first"
    exit 1
fi

echo -e "${GREEN}✅ Dependencies found${NC}"
echo ""

# Find available ports
echo "🔍 Finding available ports..."
PORT_CONFIG=$(python3 scripts/find_ports.py --save --check-current --json 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error finding available ports${NC}"
    echo "$PORT_CONFIG"
    exit 1
fi

# Parse JSON to get ports
BACKEND_PORT=$(echo "$PORT_CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['backend'])" 2>/dev/null)
FRONTEND_PORT=$(echo "$PORT_CONFIG" | python3 -c "import sys, json; print(json.load(sys.stdin)['frontend'])" 2>/dev/null)

if [ -z "$BACKEND_PORT" ] || [ -z "$FRONTEND_PORT" ]; then
    echo -e "${RED}❌ Could not determine ports${NC}"
    echo "Port config: $PORT_CONFIG"
    exit 1
fi

echo -e "${GREEN}✅ Found available ports:${NC}"
echo -e "   Backend:  ${BLUE}$BACKEND_PORT${NC}"
echo -e "   Frontend: ${BLUE}$FRONTEND_PORT${NC}"
echo ""

# Initialize database if needed
echo "🗄️ Initializing database..."
if [ -f "scripts/init_db.py" ]; then
    python3 scripts/init_db.py 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Database initialization had issues (may already exist)${NC}"
    }
else
    echo -e "${YELLOW}⚠️  Database init script not found${NC}"
fi

# Install Python dependencies if needed
echo "📦 Checking Python dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment and install dependencies
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not activate virtual environment${NC}"
}

# Check if FastAPI is installed
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "Installing Python dependencies..."
    pip install fastapi uvicorn sqlalchemy asyncpg pydantic python-jose passlib aioredis 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Some Python packages may not have installed${NC}"
    }
fi

# Start backend with dynamic port
echo ""
echo "🚀 Starting backend server on port $BACKEND_PORT..."
export BACKEND_PORT_ENV=$BACKEND_PORT
nohup python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port $BACKEND_PORT > ../backend_${BACKEND_PORT}.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo -e "   URL: ${BLUE}http://localhost:$BACKEND_PORT${NC}"

# Move to frontend directory
cd ../frontend

# Create .env.local with backend URL
echo "Creating frontend configuration..."
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:$BACKEND_PORT
NEXT_PUBLIC_WS_URL=ws://localhost:$BACKEND_PORT
EOF

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    npm install --silent || {
        echo -e "${YELLOW}⚠️  Some npm packages may not have installed${NC}"
    }
fi

# Start frontend with dynamic port
echo ""
echo "🚀 Starting frontend server on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT nohup npm run dev -- -p $FRONTEND_PORT > ../frontend_${FRONTEND_PORT}.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo -e "   URL: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 8

# Check if services are running
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

# Check backend
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    BACKEND_RUNNING=true
fi

# Check frontend
if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
fi

# Display status
echo ""
echo "================================================"
echo "📊 SweatBot Status"
echo "================================================"

if [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Backend API: http://localhost:$BACKEND_PORT${NC}"
    echo -e "${GREEN}   API Docs: http://localhost:$BACKEND_PORT/docs${NC}"
else
    echo -e "${RED}❌ Backend is not responding on port $BACKEND_PORT${NC}"
    echo -e "   Check backend_${BACKEND_PORT}.log for errors"
fi

if [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Frontend App: http://localhost:$FRONTEND_PORT${NC}"
else
    echo -e "${RED}❌ Frontend is not responding on port $FRONTEND_PORT${NC}"
    echo -e "   Check frontend_${FRONTEND_PORT}.log for errors"
fi

echo ""
echo "================================================"
echo "💡 Configuration"
echo "================================================"
echo -e "Backend Port:  ${BLUE}$BACKEND_PORT${NC}"
echo -e "Frontend Port: ${BLUE}$FRONTEND_PORT${NC}"
echo "Port config saved in: .ports.json"

echo ""
echo "================================================"
echo "💡 Quick Tips:"
echo "================================================"
echo "• Voice Commands: Hold mic button and say 'עשיתי 20 סקוואטים'"
echo "• View Backend Logs: tail -f backend_${BACKEND_PORT}.log"
echo "• View Frontend Logs: tail -f frontend_${FRONTEND_PORT}.log"
echo "• Stop Services: Press Ctrl+C"
echo "• Test API: python3 test_complete_app.py"
echo ""

if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}🎉 SweatBot is ready on custom ports!${NC}"
    echo -e "   Frontend: ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "   Backend:  ${BLUE}http://localhost:$BACKEND_PORT${NC}"
    
    # Open browser (optional)
    if command -v xdg-open &> /dev/null; then
        sleep 2
        xdg-open http://localhost:$FRONTEND_PORT 2>/dev/null
    elif command -v open &> /dev/null; then
        sleep 2
        open http://localhost:$FRONTEND_PORT 2>/dev/null
    fi
else
    echo -e "${RED}⚠️  Some services failed to start. Check the logs.${NC}"
fi

echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait indefinitely
while true; do
    sleep 1
done