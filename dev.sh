#!/bin/bash

# SweatBot Development Launcher
# Simple script to start all services in development mode

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔧 Starting SweatBot in development mode...${NC}"

# Start databases
echo -e "${GREEN}🗄️ Starting databases...${NC}"
docker-compose -f config/docker/docker-compose.yml up -d postgres mongodb redis

# Wait for databases
sleep 3

# Start backend
echo -e "${BLUE}🔙 Starting backend...${NC}"
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
cd ..

# Start frontend
echo -e "${BLUE}🎨 Starting frontend...${NC}"
cd personal-ui-vite
npm run dev &
FRONTEND_PID=$!
cd ..

# Save PIDs
mkdir -p logs
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo ""
echo -e "${GREEN}🚀 SweatBot is running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:8005${NC}"
echo -e "${BLUE}🔙 Backend:  http://localhost:8000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${RED}🛑 Stopping services...${NC}"
    
    # Stop backend and frontend
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    
    # Stop databases
    docker-compose -f config/docker/docker-compose.yml down
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Wait for services
wait $BACKEND_PID $FRONTEND_PID