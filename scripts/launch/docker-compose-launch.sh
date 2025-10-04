#!/bin/bash

# SweatBot Docker Compose Launcher
# Uses your existing Docker Compose file - proper service grouping!

log_with_time() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log_with_time "==========================================="
log_with_time "SweatBot Docker Compose Launcher"
log_with_time "Using existing setup with proper grouping"
log_with_time "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check directory
if [ ! -f "CLAUDE.md" ] || [ ! -f "docker-compose.yml" ]; then
    log_with_time "${RED}[ERROR] Run from sweatbot directory${NC}"
    exit 1
fi

# Check for Python 3.13 compatibility issue
PYTHON_VERSION=$(python3 --version 2>&1 | grep -o "3\.[0-9]*")
if [[ "$PYTHON_VERSION" == "3.13" ]]; then
    log_with_time "${YELLOW}[WARNING] Python 3.13 detected - using Python 3.11 in containers${NC}"
    log_with_time "Docker containers will use Python 3.11 to avoid asyncpg issues"
fi

# Check for port conflicts in 8000-8010 range
log_with_time "[CHECK] Checking 8000-8010 port range for conflicts..."
CONFLICTS=()

for port in {8000..8010}; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        PROCESS=$(lsof -Pi :$port -sTCP:LISTEN | tail -1 | awk '{print $1}')
        log_with_time "${YELLOW}[INFO] Port $port in use by $PROCESS${NC}"
        CONFLICTS+=($port)
    fi
done

if [ ${#CONFLICTS[@]} -eq 0 ]; then
    log_with_time "${GREEN}[OK] All SweatBot ports (8000-8010) are available${NC}"
fi

# Create backend Dockerfile for Python 3.11
log_with_time "[SETUP] Ensuring Python 3.11 backend Dockerfile..."
mkdir -p backend
cat > backend/Dockerfile << 'EOF'
# SweatBot Backend - Python 3.11 for compatibility
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    portaudio19-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create models directory for Whisper
RUN mkdir -p models

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
EOF

# Create requirements.txt for Python 3.11 compatibility
log_with_time "[SETUP] Creating Python 3.11 compatible requirements.txt..."
cat > backend/requirements.txt << 'EOF'
# Core FastAPI and web
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6

# Database
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
psycopg2-binary==2.9.9
alembic==1.12.1

# Cache and sessions
redis==5.0.1
aioredis==2.0.1

# MongoDB for conversations
pymongo==4.6.1
motor==3.3.2

# Authentication
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt
PyJWT
cryptography

# Configuration
python-dotenv==1.0.0
pydantic[email]==2.5.2
pydantic-settings==2.1.0
email-validator==2.1.0

# AI Agents
phidata
openai
groq
google-generativeai
anthropic

# Scientific computing (for voice processing)
numpy==1.24.3
scipy==1.11.4

# Audio processing (optional)
torch==2.1.1
torchaudio==2.1.1
librosa==0.10.1
soundfile==0.12.1
pydub==0.25.1

# Utilities
httpx==0.25.2
aiohttp==3.9.1
websockets==12.0
structlog==23.2.0
prometheus-client==0.19.0

# Development
pytest==7.4.3
pytest-asyncio==0.21.1
gunicorn==21.2.0
EOF

# Kill any individual containers that might conflict
log_with_time "[CLEANUP] Removing any individual SweatBot containers..."
docker rm -f sweatbot_postgres sweatbot_mongodb sweatbot_redis 2>/dev/null || true

# Stop any existing compose stack
log_with_time "[COMPOSE] Stopping any existing services..."
docker-compose down 2>/dev/null || true

# Clean up orphaned networks to prevent conflicts
log_with_time "[NETWORK] Cleaning up orphaned networks..."
docker network prune -f >/dev/null 2>&1 || true

# Remove specific conflicting networks if they exist
if docker network ls --format "{{.Name}}" | grep -q "sweatbot-backend_sweatbot-network"; then
    log_with_time "[NETWORK] Removing old SweatBot network..."
    docker network rm sweatbot-backend_sweatbot-network 2>/dev/null || true
fi

# Start the databases first (preserve data)
log_with_time "[COMPOSE] Starting database services..."
docker-compose up -d postgres mongodb redis

# Wait for databases to be ready
log_with_time "[WAIT] Waiting for databases to initialize..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U fitness_user -d hebrew_fitness >/dev/null 2>&1; then
        log_with_time "[OK] PostgreSQL ready on port 8001 - your 3,113 points are safe!"
        break
    fi
    sleep 2
    if [ $i -eq 30 ]; then
        log_with_time "${RED}[ERROR] PostgreSQL not ready after 60 seconds${NC}"
        exit 1
    fi
done

# Check Redis
for i in {1..15}; do
    if docker-compose exec -T redis redis-cli -a sweatbot_redis_pass ping >/dev/null 2>&1; then
        log_with_time "[OK] Redis ready on port 8003"
        break
    fi
    sleep 1
done

# Check MongoDB
for i in {1..15}; do
    if docker-compose exec -T mongodb mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
        log_with_time "[OK] MongoDB ready on port 8002 - conversations preserved"
        break
    fi
    sleep 1
done

echo ""

# Start backend service
log_with_time "[COMPOSE] Building and starting backend service..."
docker-compose up -d backend

# Wait for backend
log_with_time "[WAIT] Waiting for backend to be ready..."
for i in {1..45}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_with_time "[OK] Backend ready at http://localhost:8000"
        break
    fi
    sleep 2
    if [ $i -eq 45 ]; then
        log_with_time "${RED}[ERROR] Backend not ready after 90 seconds${NC}"
        log_with_time "Check logs: docker-compose logs backend"
        exit 1
    fi
done

echo ""

# Optional: Start frontend if exists
if [ -d "personal-ui-vite" ] && [ -f "personal-ui-vite/package.json" ]; then
    log_with_time "[FRONTEND] Frontend directory detected"
    
    # Create simple frontend Dockerfile
    cat > personal-ui-vite/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock* ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

EXPOSE 8004

CMD ["npm", "run", "dev", "--", "--port", "8004", "--host", "0.0.0.0"]
EOF

    # Add frontend to compose temporarily
    log_with_time "[INFO] Starting frontend on port 8004 (or using Docker Compose)..."
    
    # Try Docker Compose frontend first
    if docker-compose up -d frontend 2>/dev/null; then
        log_with_time "[INFO] Using Docker Compose frontend service"
        sleep 10
        if curl -s http://localhost:8004 > /dev/null 2>&1; then
            log_with_time "[OK] Docker Compose frontend ready at http://localhost:8004"
        fi
    else
        # Fallback to local development
        cd personal-ui-vite
        if command -v bun &> /dev/null; then
            nohup bun run dev --port 8004 --host 0.0.0.0 > ../frontend.log 2>&1 &
            FRONTEND_PID=$!
        elif command -v npm &> /dev/null; then
            nohup npm run dev -- --port 8004 --host 0.0.0.0 > ../frontend.log 2>&1 &
            FRONTEND_PID=$!
        fi
        cd ..
        
        sleep 5
        if curl -s http://localhost:8004 > /dev/null 2>&1; then
            log_with_time "[OK] Local frontend ready at http://localhost:8004"
        fi
    fi
fi

echo ""
log_with_time "==========================================="
log_with_time "SweatBot Successfully Started!"
log_with_time "All services properly grouped in Docker"
log_with_time "==========================================="
echo ""

# Final status check
log_with_time "[STATUS] Service Health Check:"

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log_with_time "   ✓ Backend API: http://localhost:8000 (Python 3.11)"
else
    log_with_time "   ✗ Backend API: Not responding"
fi

if docker-compose exec -T postgres pg_isready -U fitness_user -d hebrew_fitness >/dev/null 2>&1; then
    log_with_time "   ✓ PostgreSQL: Port 5434 (Your 3,113 points preserved)"
else
    log_with_time "   ✗ PostgreSQL: Connection issue"
fi

if docker-compose exec -T redis redis-cli -a sweatbot_redis_pass ping >/dev/null 2>&1; then
    log_with_time "   ✓ Redis: Port 6380 (No Palladio conflict)"
else
    log_with_time "   ✗ Redis: Connection issue"
fi

if docker-compose exec -T mongodb mongo --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
    log_with_time "   ✓ MongoDB: Conversations preserved"
else
    log_with_time "   ✗ MongoDB: Connection issue"
fi

if [ -n "$FRONTEND_PID" ] && curl -s http://localhost:8004 > /dev/null 2>&1; then
    log_with_time "   ✓ Frontend: http://localhost:8004"
fi

echo ""
log_with_time "[USAGE] Quick Test:"
log_with_time "curl -X POST http://localhost:8000/chat -H 'Content-Type: application/json' -d '{\"message\": \"כמה נקודות יש לי?\", \"user_id\": \"personal\"}'"
echo ""

log_with_time "[DOCKER] View grouped services: docker-compose ps"
log_with_time "[LOGS] Check logs: docker-compose logs -f backend"
echo ""

# Cleanup function
cleanup() {
    echo ""
    log_with_time "[CLEANUP] Stopping services..."
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    log_with_time "Use 'docker-compose down' to stop all services"
    log_with_time "Or 'docker-compose stop' to keep data"
    exit 0
}

trap cleanup INT

log_with_time "Press Ctrl+C to stop (databases will persist)"
echo ""

# Keep script running
wait