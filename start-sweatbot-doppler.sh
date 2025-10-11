#!/bin/bash
# SweatBot Startup Script with Doppler Secrets Management
# Usage: ./start-sweatbot-doppler.sh

set -e  # Exit on error

echo "🚀 Starting SweatBot with Doppler secrets..."
echo ""

# Check if Doppler CLI is installed
if ! command -v doppler &> /dev/null; then
    echo "❌ Doppler CLI is not installed!"
    echo "Install it with: curl -Ls https://cli.doppler.com/install.sh | sh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "config/docker/docker-compose.yml" ]; then
    echo "❌ Please run this script from the SweatBot root directory"
    exit 1
fi

# Check Doppler configuration
echo "📋 Checking Doppler configuration..."
DOPPLER_PROJECT=$(doppler configure get project --silent 2>/dev/null || echo "")
DOPPLER_CONFIG=$(doppler configure get config --silent 2>/dev/null || echo "")

if [ -z "$DOPPLER_PROJECT" ] || [ -z "$DOPPLER_CONFIG" ]; then
    echo "❌ Doppler is not configured for this directory"
    echo "Run: doppler setup --project sweatbot --config dev"
    exit 1
fi

echo "✅ Using Doppler project: $DOPPLER_PROJECT"
echo "✅ Using Doppler config: $DOPPLER_CONFIG"
echo ""

# Stop any running containers
echo "🛑 Stopping existing containers..."
cd config/docker
docker-compose down 2>/dev/null || true
echo ""

# Start services with Doppler secrets
echo "🐳 Starting Docker services with Doppler secrets..."
doppler run -- docker-compose up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service health..."
docker ps --filter "name=sweatbot" --format "table {{.Names}}\t{{.Status}}"

echo ""
echo "✅ SweatBot started successfully!"
echo ""
echo "📊 Access points:"
echo "   Backend API:  http://localhost:8000"
echo "   Frontend:     http://localhost:8005 (run 'npm run dev' in personal-ui-vite/)"
echo "   PostgreSQL:   localhost:8001"
echo "   MongoDB:      localhost:8002"
echo "   Redis:        localhost:8003"
echo ""
echo "🔧 Useful commands:"
echo "   View logs:     docker-compose -f config/docker/docker-compose.yml logs -f"
echo "   Stop services: docker-compose -f config/docker/docker-compose.yml down"
echo "   Restart:       ./start-sweatbot-doppler.sh"
echo ""
echo "🔐 All secrets are managed securely by Doppler!"
