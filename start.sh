#!/bin/bash

# SweatBot Quick Start Script
# This script starts all SweatBot services with one command

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════╗"
echo "║              🏃 Starting SweatBot...                      ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start databases
echo "📦 Starting databases..."
docker-compose -f config/docker/docker-compose.yml up -d postgres mongodb redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to initialize..."
sleep 5

# Check database health
echo "🏥 Checking database connections..."
docker-compose -f config/docker/docker-compose.yml ps

# Start backend
echo "🔙 Starting backend service (port 8000)..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🎨 Starting frontend service (port 8005)..."
cd personal-ui-vite
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down SweatBot..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    docker-compose -f config/docker/docker-compose.yml down
    echo "✅ SweatBot stopped successfully"
    exit 0
}

# Set up cleanup on script exit
trap cleanup INT TERM

# Wait a moment for services to start
sleep 3

# Display status
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ SweatBot is running!                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Backend API:  http://localhost:8000                     ║"
echo "║  Frontend UI:  http://localhost:8005                     ║"
echo "║  Health Check: http://localhost:8000/health              ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Press Ctrl+C to stop all services                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📝 Logs are being written to:"
echo "   - Backend: logs/backend.log"
echo "   - Frontend: logs/frontend.log"
echo ""

# Keep script running
wait