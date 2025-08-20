#!/bin/bash

# SweatBot Docker-Only Startup - NO LOCAL INSTALLATIONS!
# Everything runs in containers - clean and isolated

echo "================================================"
echo "🐳 SweatBot Hebrew Fitness AI Tracker"
echo "   Docker Container System"
echo "   NO LOCAL INSTALLATIONS!"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker from docker.com"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not available${NC}"
    echo "Please ensure Docker is properly installed"
    exit 1
fi

echo -e "${GREEN}✅ Docker is ready${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.auto.yml" ]; then
    echo -e "${RED}❌ Error: docker-compose.auto.yml not found${NC}"
    echo "Please run this script from the SweatBot root directory"
    exit 1
fi

# Find available ports
echo "🔍 Finding available ports..."
if ! python3 scripts/docker_ports.py; then
    echo -e "${RED}❌ Failed to find available ports${NC}"
    echo "Make sure Python 3 is installed for port detection"
    exit 1
fi

# Read port configuration
if [ ! -f ".docker-ports.json" ]; then
    echo -e "${RED}❌ Port configuration not found${NC}"
    exit 1
fi

# Parse ports from JSON
BACKEND_PORT=$(python3 -c "import json; print(json.load(open('.docker-ports.json'))['backend'])")
FRONTEND_PORT=$(python3 -c "import json; print(json.load(open('.docker-ports.json'))['frontend'])")

echo ""
echo "📦 Building Docker containers..."
echo "   This may take a few minutes on first run..."
echo ""

# Build containers
if ! docker compose -f docker-compose.auto.yml build; then
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

echo ""
echo "🚀 Starting SweatBot services..."
if ! docker compose -f docker-compose.auto.yml up -d; then
    echo -e "${RED}❌ Failed to start Docker containers${NC}"
    exit 1
fi

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Function to check container health
check_health() {
    local container=$1
    local status=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)
    if [ "$status" = "healthy" ]; then
        return 0
    else
        return 1
    fi
}

# Check container status
echo ""
echo "================================================"
echo "📊 SweatBot Container Status"
echo "================================================"
echo ""

# Show container status
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep sweatbot

# Check health of each service
echo ""
if check_health sweatbot_backend; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend is starting...${NC}"
fi

if check_health sweatbot_postgres; then
    echo -e "${GREEN}✅ Database is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Database is starting...${NC}"
fi

echo ""
echo "================================================"
echo "🌐 SweatBot URLs"
echo "================================================"
echo ""
echo -e "📱 Frontend App:  ${BLUE}http://localhost:$FRONTEND_PORT${NC}"
echo -e "🔧 Backend API:   ${BLUE}http://localhost:$BACKEND_PORT${NC}"
echo -e "📚 API Docs:      ${BLUE}http://localhost:$BACKEND_PORT/docs${NC}"
echo "🗄️ PostgreSQL:    localhost:5432"
echo "💾 Redis:         localhost:6379"
echo ""
echo "================================================"
echo "💡 Docker Commands"
echo "================================================"
echo ""
echo "View logs:        docker compose -f docker-compose.auto.yml logs -f"
echo "Stop services:    docker compose -f docker-compose.auto.yml down"
echo "Clean everything: docker compose -f docker-compose.auto.yml down -v"
echo "Rebuild:          docker compose -f docker-compose.auto.yml build --no-cache"
echo "Enter backend:    docker exec -it sweatbot_backend bash"
echo "Enter frontend:   docker exec -it sweatbot_frontend sh"
echo ""

# Open browser if available
if command -v xdg-open &> /dev/null; then
    echo "🌐 Opening SweatBot in your browser..."
    sleep 2
    xdg-open http://localhost:$FRONTEND_PORT 2>/dev/null
elif command -v open &> /dev/null; then
    echo "🌐 Opening SweatBot in your browser..."
    sleep 2
    open http://localhost:$FRONTEND_PORT 2>/dev/null
fi

echo -e "${GREEN}✅ SweatBot is running in Docker containers!${NC}"
echo ""
echo "Press Ctrl+C to stop all containers"
echo ""

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping Docker containers..."
    docker compose -f docker-compose.auto.yml down
    echo "Containers stopped."
    exit 0
}

# Set up trap for Ctrl+C
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
done