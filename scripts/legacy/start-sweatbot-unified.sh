#!/bin/bash

# SweatBot Unified Launch Script
# Single command to start all services with intelligent management
# Usage: ./start-sweatbot-unified.sh [--mode=dev|prod|minimal] [--pm2] [--status] [--stop]

set -e  # Exit on error

# ANSI color codes for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

# Load environment variables
if [ -f ".env.unified" ]; then
    # Use a safer method to load environment variables
    set -a
    source .env.unified
    set +a
else
    echo -e "${RED}❌ Error: .env.unified not found!${NC}"
    echo "Please create .env.unified from the template first."
    exit 1
fi

# Parse command line arguments
MODE="dev"
USE_PM2=${PM2_ENABLED:-false}  # Use environment variable as default
SHOW_STATUS=false
STOP_SERVICES=false

for arg in "$@"; do
    case $arg in
        --mode=*)
            MODE="${arg#*=}"
            ;;
        --pm2)
            USE_PM2=true
            ;;
        --status)
            SHOW_STATUS=true
            ;;
        --stop)
            STOP_SERVICES=true
            ;;
        --help)
            echo "SweatBot Unified Launch Script"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --mode=dev|prod|minimal  Launch mode (default: dev)"
            echo "  --pm2                    Use PM2 process manager"
            echo "  --status                 Show service status and exit"
            echo "  --stop                   Stop all services"
            echo "  --help                   Show this help message"
            echo ""
            echo "Modes:"
            echo "  dev      - Development with hot reload"
            echo "  prod     - Production optimized"
            echo "  minimal  - Core services only (no Ollama, monitoring)"
            exit 0
            ;;
    esac
done

# Function to print colored messages
print_header() {
    echo ""
    echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}║${WHITE}              🏋️  SweatBot Unified Launcher  🏋️              ${MAGENTA}║${NC}"
    echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    local service=$1
    local status=$2
    local port=$3
    
    if [ "$status" = "running" ]; then
        echo -e "  ${GREEN}✅${NC} $service ${GREEN}(running on port $port)${NC}"
    elif [ "$status" = "starting" ]; then
        echo -e "  ${YELLOW}⏳${NC} $service ${YELLOW}(starting on port $port...)${NC}"
    else
        echo -e "  ${RED}❌${NC} $service ${RED}(stopped)${NC}"
    fi
}

# Function to check if a port is in use
check_port() {
    local port=$1
    # Use ss (socket statistics) which is more reliable for Docker port mappings
    if ss -tlnp | grep -q ":$port "; then
        return 0
    # Fallback to lsof if ss doesn't work
    elif command -v lsof >/dev/null && lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    # Final fallback using nc (netcat) to test connectivity
    elif command -v nc >/dev/null && timeout 1 nc -z localhost $port >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to wait for a service to be ready
wait_for_service() {
    local service_name=$1
    local port=$2
    local max_wait=30
    local elapsed=0
    
    echo -en "${YELLOW}  ⏳ Waiting for $service_name to be ready...${NC}"
    
    while [ $elapsed -lt $max_wait ]; do
        if check_port $port; then
            echo -e "\r${GREEN}  ✅ $service_name is ready!                    ${NC}"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
        echo -en "\r${YELLOW}  ⏳ Waiting for $service_name to be ready... ${elapsed}s${NC}"
    done
    
    echo -e "\r${RED}  ❌ $service_name failed to start (timeout)     ${NC}"
    return 1
}

# Function to check service health
check_service_health() {
    local service=$1
    local port=$2
    
    if check_port $port; then
        echo "running"
    else
        echo "stopped"
    fi
}

# Function to show current status
show_status() {
    print_header
    echo -e "${CYAN}📊 Service Status:${NC}"
    echo ""
    
    # Check each service
    print_status "PostgreSQL" $(check_service_health "postgres" $POSTGRES_PORT) $POSTGRES_PORT
    print_status "MongoDB" $(check_service_health "mongodb" $MONGODB_PORT) $MONGODB_PORT
    print_status "Redis" $(check_service_health "redis" $REDIS_PORT) $REDIS_PORT
    print_status "Backend API" $(check_service_health "backend" $BACKEND_PORT) $BACKEND_PORT
    print_status "Frontend UI" $(check_service_health "frontend" $FRONTEND_PORT) $FRONTEND_PORT
    print_status "AI Agent" $(check_service_health "agent" $AGENT_PORT) $AGENT_PORT
    print_status "Health Dashboard" $(check_service_health "health" $HEALTH_DASHBOARD_PORT) $HEALTH_DASHBOARD_PORT
    print_status "Ollama" $(check_service_health "ollama" 11434) 11434
    
    echo ""
    echo -e "${CYAN}🔗 Access URLs:${NC}"
    echo -e "  Frontend:    ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  Backend API: ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
    echo -e "  Agent API:   ${BLUE}http://localhost:$AGENT_PORT/docs${NC}"
    echo -e "  Health:      ${BLUE}http://localhost:$HEALTH_DASHBOARD_PORT${NC}"
    echo ""
}

# Function to stop all services
stop_all_services() {
    echo -e "${YELLOW}🛑 Stopping all SweatBot services...${NC}"
    
    # Stop PM2 processes if using PM2
    if command -v pm2 &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi
    
    # Stop Docker containers
    docker stop sweatbot_postgres sweatbot_mongodb sweatbot_redis 2>/dev/null || true
    
    # Kill processes on SweatBot ports
    for port in $BACKEND_PORT $FRONTEND_PORT $AGENT_PORT $HEALTH_DASHBOARD_PORT; do
        if check_port $port; then
            echo -e "  Stopping service on port $port..."
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
        fi
    done
    
    # Stop Ollama
    pkill ollama 2>/dev/null || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
}

# Function to start Docker services
start_docker_services() {
    echo -e "${CYAN}🐳 Starting Docker services...${NC}"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        echo -e "${YELLOW}  ⚠️  docker-compose.yml not found, starting containers individually${NC}"
        
        # Start PostgreSQL
        if ! docker ps | grep -q sweatbot_postgres; then
            echo -e "  Starting PostgreSQL..."
            docker run -d --name sweatbot_postgres \
                -p $POSTGRES_PORT:5432 \
                -e POSTGRES_DB=hebrew_fitness \
                -e POSTGRES_USER=fitness_user \
                -e POSTGRES_PASSWORD=secure_password \
                postgres:15-alpine 2>/dev/null || docker start sweatbot_postgres
        fi
        
        # Start MongoDB
        if ! docker ps | grep -q sweatbot_mongodb; then
            echo -e "  Starting MongoDB..."
            docker run -d --name sweatbot_mongodb \
                -p $MONGODB_PORT:27017 \
                -e MONGO_INITDB_ROOT_USERNAME=sweatbot \
                -e MONGO_INITDB_ROOT_PASSWORD=secure_password \
                mongo:6 2>/dev/null || docker start sweatbot_mongodb
        fi
        
        # Start Redis
        if ! docker ps | grep -q sweatbot_redis; then
            echo -e "  Starting Redis..."
            docker run -d --name sweatbot_redis \
                -p $REDIS_PORT:6379 \
                redis:7-alpine redis-server --requirepass sweatbot_redis_pass 2>/dev/null || docker start sweatbot_redis
        fi
    else
        echo -e "  Using docker-compose..."
        docker-compose up -d postgres mongodb redis
    fi
    
    # Wait for databases to be ready
    wait_for_service "PostgreSQL" $POSTGRES_PORT
    wait_for_service "MongoDB" $MONGODB_PORT
    wait_for_service "Redis" $REDIS_PORT
}

# Function to start services with PM2
start_with_pm2() {
    echo -e "${CYAN}🚀 Starting services with PM2...${NC}"
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}  Installing PM2...${NC}"
        npm install -g pm2
    fi
    
    # Start all services
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    echo -e "${GREEN}✅ All services started with PM2${NC}"
    echo -e "  Use ${CYAN}pm2 status${NC} to check service status"
    echo -e "  Use ${CYAN}pm2 logs${NC} to view logs"
    echo -e "  Use ${CYAN}pm2 monit${NC} for real-time monitoring"
}

# Function to start services manually
start_services_manual() {
    echo -e "${CYAN}🚀 Starting services manually...${NC}"
    
    # Create logs directory
    mkdir -p logs
    
    # Start Ollama if not in minimal mode
    if [ "$MODE" != "minimal" ]; then
        if ! check_port 11434; then
            echo -e "  Starting Ollama..."
            OLLAMA_HOST=0.0.0.0 ollama serve > logs/ollama.log 2>&1 &
            sleep 2
        fi
    fi
    
    # Start Backend
    if ! check_port $BACKEND_PORT; then
        echo -e "  Starting Backend API..."
        cd backend
        python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../logs/backend.log 2>&1 &
        cd ..
        wait_for_service "Backend API" $BACKEND_PORT
    fi
    
    # Start Agent Service
    if ! check_port $AGENT_PORT; then
        echo -e "  Starting AI Agent Service..."
        python agent_service.py > logs/agent.log 2>&1 &
        wait_for_service "AI Agent" $AGENT_PORT
    fi
    
    # Start Frontend
    if ! check_port $FRONTEND_PORT; then
        echo -e "  Starting Frontend UI..."
        cd personal-ui-vite
        npm run dev > ../logs/frontend.log 2>&1 &
        cd ..
        wait_for_service "Frontend UI" $FRONTEND_PORT
    fi
    
    # Start Health Dashboard
    if ! check_port $HEALTH_DASHBOARD_PORT; then
        echo -e "  Starting Health Dashboard..."
        python health_dashboard.py > logs/health.log 2>&1 &
        wait_for_service "Health Dashboard" $HEALTH_DASHBOARD_PORT
    fi
}

# Function to ensure dependencies
ensure_dependencies() {
    echo -e "${CYAN}📦 Checking dependencies...${NC}"
    
    # Check Python version
    python_version=$(python3 --version 2>&1)
    echo -e "  ${BLUE}Python version:${NC} $python_version"
    
    # Warn if not using Python 3.11
    if [[ ! "$python_version" =~ "3.11" ]]; then
        echo -e "${YELLOW}  ⚠️  Warning: Not using Python 3.11 (currently using $python_version)${NC}"
        echo -e "${YELLOW}     Python 3.11 is recommended for stability${NC}"
        echo -e "${YELLOW}     To install: conda install python=3.11 -y${NC}"
        echo ""
    fi
    
    # Check if venv exists and create if needed
    if [ ! -d "venv" ]; then
        echo -e "  ${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv || {
            echo -e "${RED}  ❌ Failed to create virtual environment${NC}"
            echo -e "${YELLOW}     Try: sudo apt install python3-venv${NC}"
            exit 1
        }
        echo -e "  ${GREEN}✅ Virtual environment created${NC}"
    else
        echo -e "  ${GREEN}✅ Virtual environment exists${NC}"
    fi
    
    # Activate venv
    source venv/bin/activate
    
    # Install backend dependencies
    if [ ! -f "venv/.deps_installed" ]; then
        echo -e ""
        echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
        echo -e "${CYAN}  This may take a few minutes on first run${NC}"
        echo ""
        
        # CRITICAL: Install build tools first to avoid setuptools errors
        echo -e "  ${BLUE}[1/3]${NC} Installing build essentials (pip, setuptools, wheel)..."
        pip install --upgrade pip setuptools wheel || {
            echo -e "${RED}  ❌ Failed to install build tools!${NC}"
            echo -e "${YELLOW}     This is usually due to network issues or Python version incompatibility${NC}"
            echo -e "${YELLOW}     Try:${NC}"
            echo -e "${YELLOW}       1. rm -rf venv${NC}"
            echo -e "${YELLOW}       2. conda install python=3.11 -y${NC}"
            echo -e "${YELLOW}       3. Run this script again${NC}"
            exit 1
        }
        echo -e "  ${GREEN}✅ Build tools installed${NC}"
        echo ""
        
        # Install backend requirements
        echo -e "  ${BLUE}[2/3]${NC} Installing backend requirements from requirements.txt..."
        echo -e "  ${CYAN}     (fastapi, sqlalchemy, redis, mongodb, etc.)${NC}"
        pip install -r backend/requirements.txt || {
            echo -e "${RED}  ❌ Failed to install backend requirements!${NC}"
            echo -e "${YELLOW}     Check the error messages above for details${NC}"
            echo -e "${YELLOW}     Common issues:${NC}"
            echo -e "${YELLOW}       - Network connectivity problems${NC}"
            echo -e "${YELLOW}       - Package version conflicts${NC}"
            echo -e "${YELLOW}       - Missing system dependencies${NC}"
            exit 1
        }
        echo -e "  ${GREEN}✅ Backend requirements installed${NC}"
        echo ""
        
        # Install additional packages
        echo -e "  ${BLUE}[3/3]${NC} Installing additional packages..."
        echo -e "  ${CYAN}     (motor, httpx, psutil, asyncpg, redis)${NC}"
        pip install motor httpx psutil asyncpg redis || {
            echo -e "${RED}  ❌ Failed to install additional packages!${NC}"
            echo -e "${YELLOW}     These packages are required for:${NC}"
            echo -e "${YELLOW}       - MongoDB connectivity (motor)${NC}"
            echo -e "${YELLOW}       - HTTP client (httpx)${NC}"
            echo -e "${YELLOW}       - System monitoring (psutil)${NC}"
            echo -e "${YELLOW}       - PostgreSQL async (asyncpg)${NC}"
            echo -e "${YELLOW}       - Redis cache (redis)${NC}"
            exit 1
        }
        echo -e "  ${GREEN}✅ Additional packages installed${NC}"
        
        # Mark as installed
        touch venv/.deps_installed
        echo ""
        echo -e "${GREEN}✅ All Python dependencies installed successfully!${NC}"
    else
        echo -e "  ${GREEN}✅ Python dependencies already installed${NC}"
        echo -e "  ${CYAN}    (delete venv/.deps_installed to force reinstall)${NC}"
    fi
    
    # Check Node packages for frontend
    if [ ! -d "personal-ui-vite/node_modules" ]; then
        echo ""
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        cd personal-ui-vite
        
        # Check Node.js version
        node_version=$(node --version 2>&1)
        echo -e "  ${BLUE}Node.js version:${NC} $node_version"
        
        echo -e "  ${CYAN}Running npm install...${NC}"
        npm install || {
            echo -e "${RED}  ❌ Failed to install frontend dependencies!${NC}"
            echo -e "${YELLOW}     Try:${NC}"
            echo -e "${YELLOW}       1. cd personal-ui-vite${NC}"
            echo -e "${YELLOW}       2. rm -rf node_modules package-lock.json${NC}"
            echo -e "${YELLOW}       3. npm install${NC}"
            cd ..
            exit 1
        }
        cd ..
        echo -e "${GREEN}✅ Frontend dependencies installed!${NC}"
    else
        echo -e "  ${GREEN}✅ Frontend dependencies already installed${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ All dependencies ready!${NC}"
    echo ""
}

# Main execution
main() {
    # Handle status command
    if [ "$SHOW_STATUS" = true ]; then
        show_status
        exit 0
    fi
    
    # Handle stop command
    if [ "$STOP_SERVICES" = true ]; then
        stop_all_services
        exit 0
    fi
    
    # Start services
    print_header
    echo -e "${CYAN}Mode: ${WHITE}$MODE${NC}"
    echo -e "${CYAN}PM2:  ${WHITE}$([ "$USE_PM2" = true ] && echo "Enabled" || echo "Disabled")${NC}"
    echo ""
    
    # Ensure dependencies are installed
    ensure_dependencies
    
    # Start Docker services
    start_docker_services
    
    # Start application services
    if [ "$USE_PM2" = true ]; then
        start_with_pm2
    else
        start_services_manual
    fi
    
    # Show final status
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✅ SweatBot is ready to use! ✅                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🔗 Access Points:${NC}"
    echo -e "  ${WHITE}Frontend:${NC}        ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
    echo -e "  ${WHITE}Backend API:${NC}     ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
    echo -e "  ${WHITE}Agent API:${NC}       ${BLUE}http://localhost:$AGENT_PORT/docs${NC}"
    echo -e "  ${WHITE}Health Monitor:${NC}  ${BLUE}http://localhost:$HEALTH_DASHBOARD_PORT${NC}"
    echo ""
    echo -e "${CYAN}📝 Commands:${NC}"
    echo -e "  ${WHITE}Check status:${NC}   ./start-sweatbot-unified.sh --status"
    echo -e "  ${WHITE}Stop all:${NC}       ./start-sweatbot-unified.sh --stop"
    echo -e "  ${WHITE}View logs:${NC}      tail -f logs/*.log"
    if [ "$USE_PM2" = true ]; then
        echo -e "  ${WHITE}PM2 status:${NC}     pm2 status"
        echo -e "  ${WHITE}PM2 logs:${NC}       pm2 logs"
    fi
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Keep script running if not using PM2
    if [ "$USE_PM2" = false ]; then
        # Trap Ctrl+C to cleanup
        trap 'echo -e "\n${YELLOW}Shutting down...${NC}"; stop_all_services; exit 0' INT
        
        # Keep the script running
        while true; do
            sleep 1
        done
    fi
}

# Run main function
main