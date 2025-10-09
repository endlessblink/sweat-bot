#!/bin/bash

# SweatBot Ecosystem Launcher
# Complete ecosystem management for SweatBot AI Assistant

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

function show_header() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                    SweatBot Command Center                    ║${NC}"
    echo -e "${CYAN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${WHITE}║ Quick Actions:                                            ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh start    - Start all services                 ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh stop     - Stop all services                  ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh dev      - Development mode with reload        ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh status   - Check service status              ║${NC}"
    echo -e "${WHITE}║                                                           ║${NC}"
    echo -e "${WHITE}║ Individual Services:                                      ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh backend  - Backend only (port 8000)         ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh frontend - Frontend only (port 8005)        ║${NC}"
    echo -e "${WHITE}║   ./sweatbot.sh db      - Databases only                   ║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════╣${NC}"
    echo ""
}

function show_help() {
    show_header
    echo -e "${YELLOW}Usage: ./sweatbot.sh [command]${NC}"
    echo ""
    echo -e "${WHITE}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}     - Start all SweatBot services"
    echo -e "  ${RED}stop${NC}      - Stop all SweatBot services"
    echo -e "  ${YELLOW}dev${NC}       - Start in development mode"
    echo -e "  ${BLUE}status${NC}    - Check service status"
    echo -e "  ${CYAN}backend${NC}   - Start backend only"
    echo -e "  ${MAGENTA}frontend${NC} - Start frontend only"
    echo -e "  ${GRAY}db${NC}        - Start databases only"
    echo -e "  ${WHITE}help${NC}      - Show this help message"
    echo ""
    echo -e "${WHITE}Examples:${NC}"
    echo -e "  ${GRAY}./sweatbot.sh start${NC}"
    echo -e "  ${GRAY}./sweatbot.sh dev${NC}"
    echo -e "  ${GRAY}./sweatbot.sh status${NC}"
}

function start_databases() {
    echo -e "${GRAY}🗄️ Starting databases...${NC}"
    docker-compose -f config/docker/docker-compose.yml up -d postgres mongodb redis
    sleep 3
}

function start_backend() {
    echo -e "${BLUE}🔙 Starting backend...${NC}"
    cd backend
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../logs/backend.pid
    cd ..
    sleep 2
}

function start_frontend() {
    echo -e "${MAGENTA}🎨 Starting frontend...${NC}"
    cd personal-ui-vite
    npm run dev > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../logs/frontend.pid
    cd ..
    sleep 3
}

function stop_services() {
    echo -e "${RED}🛑 Stopping SweatBot services...${NC}"
    
    # Stop backend
    if [ -f logs/backend.pid ]; then
        kill $(cat logs/backend.pid) 2>/dev/null || true
        rm -f logs/backend.pid
    fi
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    
    # Stop frontend
    if [ -f logs/frontend.pid ]; then
        kill $(cat logs/frontend.pid) 2>/dev/null || true
        rm -f logs/frontend.pid
    fi
    pkill -f "vite" 2>/dev/null || true
    
    # Stop databases
    docker-compose -f config/docker/docker-compose.yml down
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

function check_status() {
    echo ""
    echo -e "${CYAN}📊 Service Status Report:${NC}"
    echo -e "${GRAY}──────────────────────────────────${NC}"
    echo ""
    
    # Check backend
    if ss -an 2>/dev/null | grep -q ":8000 "; then
        echo -e "${GREEN}✅ Backend: RUNNING (http://localhost:8000)${NC}"
    else
        echo -e "${RED}❌ Backend: STOPPED${NC}"
    fi
    
    # Check frontend
    if ss -an 2>/dev/null | grep -q ":8005 "; then
        echo -e "${GREEN}✅ Frontend: RUNNING (http://localhost:8005)${NC}"
    else
        echo -e "${RED}❌ Frontend: STOPPED${NC}"
    fi
    
    # Check databases
    if docker-compose -f config/docker/docker-compose.yml ps postgres mongodb redis 2>/dev/null | grep -q "Up"; then
        echo -e "${GREEN}✅ Databases: RUNNING${NC}"
    else
        echo -e "${RED}❌ Databases: STOPPED${NC}"
    fi
    
    echo ""
    echo -e "${GRAY}──────────────────────────────────${NC}"
    echo ""
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Main execution logic
case "${1:-help}" in
    "start")
        echo -e "${GREEN}🚀 Starting SweatBot ecosystem...${NC}"
        start_databases
        start_backend
        start_frontend
        sleep 2
        check_status
        ;;
    "stop")
        stop_services
        ;;
    "dev")
        echo -e "${YELLOW}🔧 Starting SweatBot in development mode...${NC}"
        start_databases
        
        # Start backend in foreground
        echo -e "${BLUE}🔙 Starting backend...${NC}"
        cd backend
        python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
        BACKEND_PID=$!
        cd ..
        
        # Start frontend in foreground  
        echo -e "${MAGENTA}🎨 Starting frontend...${NC}"
        cd personal-ui-vite
        npm run dev &
        FRONTEND_PID=$!
        cd ..
        
        # Save PIDs for cleanup
        echo $BACKEND_PID > logs/backend.pid
        echo $FRONTEND_PID > logs/frontend.pid
        
        echo -e "${GREEN}🚀 Services started! Press Ctrl+C to stop all services${NC}"
        echo -e "${BLUE}📱 Frontend: http://localhost:8005${NC}"
        echo -e "${BLUE}🔙 Backend:  http://localhost:8000${NC}"
        echo ""
        
        # Wait for services and cleanup on exit
        trap 'echo -e "${RED}🛑 Stopping services...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; docker-compose -f config/docker/docker-compose.yml down; echo -e "${GREEN}✅ All services stopped${NC}"; exit 0' INT
        
        # Keep script running
        wait $BACKEND_PID $FRONTEND_PID
        ;;
    "status")
        check_status
        ;;
    "backend")
        echo -e "${CYAN}🔙 Starting backend service...${NC}"
        start_databases
        start_backend
        ;;
    "frontend")
        echo -e "${MAGENTA}🎨 Starting frontend service...${NC}"
        start_frontend
        ;;
    "db")
        echo -e "${GRAY}🗄️ Starting database services...${NC}"
        start_databases
        ;;
    "help"|*)
        show_help
        ;;
esac

echo ""
echo -e "${GREEN}✨ SweatBot operation completed!${NC}"
echo ""