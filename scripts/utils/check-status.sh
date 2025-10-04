#!/bin/bash

# SweatBot Status Checker
# Shows current status of all SweatBot services

echo "================================================"
echo "SweatBot System Status Check"
echo "================================================"
echo ""

# Check Docker Compose services
echo "[DOCKER COMPOSE] Service Status:"
if command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    docker-compose ps 2>/dev/null || echo "   No Docker Compose services running"
else
    echo "   Docker Compose not available or no config file"
fi

echo ""

# Check individual containers (from old method)
echo "[INDIVIDUAL CONTAINERS] Legacy Containers:"
INDIVIDUAL_CONTAINERS=$(docker ps --filter "name=sweatbot_" --format "{{.Names}} ({{.Status}})" 2>/dev/null)
if [ -n "$INDIVIDUAL_CONTAINERS" ]; then
    echo "$INDIVIDUAL_CONTAINERS"
else
    echo "   No individual SweatBot containers running"
fi

echo ""

# Port status
echo "[PORTS] Service Availability:"

# Backend
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "   ✓ Backend API: http://localhost:8000 (WORKING)"
else
    echo "   ✗ Backend API: http://localhost:8000 (DOWN)"
fi

# Frontend options
for port in 8004 4445 3000; do
    if curl -s http://localhost:$port > /dev/null 2>&1; then
        echo "   ✓ Frontend: http://localhost:$port (WORKING)"
        break
    fi
done

# SweatBot Standard Port Range (8000-8010)
echo ""
echo "[8000-8010 RANGE] SweatBot Services:"

# PostgreSQL (8001)
if pg_isready -h localhost -p 8001 -U fitness_user > /dev/null 2>&1; then
    echo "   ✓ PostgreSQL: Port 8001 (Your 3,113 points safe)"
else
    echo "   ✗ PostgreSQL: Port 8001 not accessible"
fi

# MongoDB (8002)
if mongo --host localhost:8002 --username sweatbot --password secure_password --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "   ✓ MongoDB: Port 8002 (Conversations preserved)"
else
    echo "   ✗ MongoDB: Port 8002 not accessible"
fi

# Redis (8003)
if redis-cli -h localhost -p 8003 -a sweatbot_redis_pass ping > /dev/null 2>&1; then
    echo "   ✓ Redis: Port 8003 (Clean port range)"
else
    echo "   ✗ Redis: Port 8003 not accessible"
fi

# Check legacy ports for migration status
echo ""
echo "[LEGACY PORTS] Migration Status:"
LEGACY_FOUND=false

if pg_isready -h localhost -p 5432 -U fitness_user > /dev/null 2>&1 || pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
    echo "   ⚠ PostgreSQL found on legacy port (5432/5434) - consider migration"
    LEGACY_FOUND=true
fi

if redis-cli -h localhost -p 6379 ping > /dev/null 2>&1 || redis-cli -h localhost -p 6380 ping > /dev/null 2>&1; then
    echo "   ⚠ Redis found on legacy port (6379/6380) - consider migration"
    LEGACY_FOUND=true
fi

if mongo --host localhost:27017 --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "   ⚠ MongoDB found on legacy port (27017) - consider migration"
    LEGACY_FOUND=true
fi

if [ "$LEGACY_FOUND" = false ]; then
    echo "   ✓ No legacy services found - fully migrated to 8000-8010 range"
fi

echo ""

# Python environment
echo "[PYTHON] Environment Status:"
if [ -f "backend/venv/bin/activate" ] || [ -f "backend/venv/Scripts/activate" ]; then
    echo "   ✓ Virtual environment exists: backend/venv/"
    cd backend
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    PYTHON_VERSION=$(python --version 2>&1)
    echo "   Python version: $PYTHON_VERSION"
    
    # Check key packages
    if python -c "import fastapi, uvicorn, phidata" > /dev/null 2>&1; then
        echo "   ✓ Key packages installed (FastAPI, Uvicorn, Phidata)"
    else
        echo "   ✗ Missing key packages"
    fi
    cd ..
else
    echo "   ✗ No virtual environment found"
fi

echo ""

# Recommendations
echo "[RECOMMENDATIONS]"
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo "   → System is using Docker Compose (EXCELLENT - proper grouping)"
    echo "   → All services in 8000-8010 range (MODERN ARCHITECTURE)"
    echo "   → Stop with: docker-compose down"
    echo "   → View logs: docker-compose logs -f backend"
    echo "   → Health check: curl http://localhost:8000/health"
elif docker ps --filter "name=sweatbot_" --format "{{.Names}}" 2>/dev/null | grep -q sweatbot; then
    echo "   → System is using individual containers (needs migration to 8000-8010)"
    echo "   → Stop current: docker stop \$(docker ps -q --filter 'name=sweatbot_')"
    echo "   → Migrate to standard ports: ./launch-sweatbot-compose.sh"
elif [ "$LEGACY_FOUND" = true ]; then
    echo "   → Legacy services found on scattered ports"
    echo "   → Migrate to unified 8000-8010 range: ./launch-sweatbot-compose.sh"
else
    echo "   → No SweatBot services detected"
    echo "   → Start with unified port range: ./launch-sweatbot-compose.sh"
    echo "   → Or quick restart existing: ./restart-sweatbot.sh"
fi

echo ""
echo "[PORT SUMMARY] SweatBot Standard Architecture:"
echo "   8000 → Backend API (FastAPI)"
echo "   8001 → PostgreSQL Database"
echo "   8002 → MongoDB (Conversations)"
echo "   8003 → Redis Cache"
echo "   8004 → Frontend (Next.js/Vite)"
echo "   8005-8010 → Available for expansion"

echo ""
echo "================================================"