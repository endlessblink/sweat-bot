#!/bin/bash

# SweatBot Hebrew Fitness AI Tracker - One-Click Startup Script
# This script starts the complete application with all services

echo "================================================"
echo "🚀 SweatBot Hebrew Fitness AI Tracker"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo -e "${RED}❌ Error: Please run this script from the sweatbot directory${NC}"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

# Function to kill process on port
kill_port() {
    echo -e "${YELLOW}Killing process on port $1...${NC}"
    lsof -ti:$1 | xargs kill -9 2>/dev/null
}

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

# Check and free ports
echo "🔍 Checking ports..."
if ! check_port 8000; then
    echo -e "${YELLOW}Port 8000 is in use${NC}"
    read -p "Kill process on port 8000? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 8000
    else
        echo -e "${RED}Cannot start backend - port 8000 is in use${NC}"
        exit 1
    fi
fi

if ! check_port 3000; then
    echo -e "${YELLOW}Port 3000 is in use${NC}"
    read -p "Kill process on port 3000? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 3000
    else
        echo -e "${RED}Cannot start frontend - port 3000 is in use${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Ports are available${NC}"
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

# Start backend in background
echo ""
echo "🚀 Starting backend server..."
nohup python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Move to frontend directory
cd ../frontend

# Install frontend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    npm install --silent || {
        echo -e "${YELLOW}⚠️  Some npm packages may not have installed${NC}"
    }
fi

# Start frontend in background
echo ""
echo "🚀 Starting frontend server..."
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for services to start
echo ""
echo "⏳ Waiting for services to start..."
sleep 5

# Check if services are running
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

# Check backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    BACKEND_RUNNING=true
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
fi

# Display status
echo ""
echo "================================================"
echo "📊 SweatBot Status"
echo "================================================"

if [ "$BACKEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Backend API: http://localhost:8000${NC}"
    echo -e "${GREEN}   API Docs: http://localhost:8000/docs${NC}"
else
    echo -e "${RED}❌ Backend is not responding${NC}"
    echo -e "   Check backend.log for errors"
fi

if [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Frontend App: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend is not responding${NC}"
    echo -e "   Check frontend.log for errors"
fi

echo ""
echo "================================================"
echo "💡 Quick Tips:"
echo "================================================"
echo "• Voice Commands: Hold mic button and say 'עשיתי 20 סקוואטים'"
echo "• View Logs: tail -f backend.log or tail -f frontend.log"
echo "• Stop Services: Press Ctrl+C or run: kill $BACKEND_PID $FRONTEND_PID"
echo "• Test API: python3 test_complete_app.py"
echo ""

if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}🎉 SweatBot is ready! Open http://localhost:3000${NC}"
    
    # Open browser (optional)
    if command -v xdg-open &> /dev/null; then
        sleep 2
        xdg-open http://localhost:3000 2>/dev/null
    elif command -v open &> /dev/null; then
        sleep 2
        open http://localhost:3000 2>/dev/null
    fi
else
    echo -e "${RED}⚠️  Some services failed to start. Check the logs.${NC}"
fi

# Keep script running and handle Ctrl+C
trap "echo ''; echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT

echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait