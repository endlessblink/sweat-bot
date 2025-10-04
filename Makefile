# SweatBot - Hebrew Fitness AI Assistant
# Run 'make help' to see all available commands

.PHONY: help start stop dev test install clean logs db-start db-stop backend frontend docker-up docker-down

# Default target
help:
	@echo "╔══════════════════════════════════════════════════════════╗"
	@echo "║              SweatBot Command Center                      ║"
	@echo "╠══════════════════════════════════════════════════════════╣"
	@echo "║ Quick Start:                                              ║"
	@echo "║   make start    - Start all services                     ║"
	@echo "║   make stop     - Stop all services                      ║"
	@echo "║   make dev      - Start development environment          ║"
	@echo "║                                                           ║"
	@echo "║ Individual Services:                                      ║"
	@echo "║   make backend  - Start backend only (port 8000)         ║"
	@echo "║   make frontend - Start frontend only (port 8005)        ║"
	@echo "║   make db-start - Start databases only                   ║"
	@echo "║                                                           ║"
	@echo "║ Testing & Maintenance:                                    ║"
	@echo "║   make test     - Run all tests                          ║"
	@echo "║   make install  - Install all dependencies               ║"
	@echo "║   make clean    - Clean temporary files                  ║"
	@echo "║   make logs     - Show all logs                          ║"
	@echo "╚══════════════════════════════════════════════════════════╝"

# Start all services
start: db-start
	@echo "🚀 Starting SweatBot services..."
	@cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
	@cd personal-ui-vite && npm run dev > ../logs/frontend.log 2>&1 &
	@echo "✅ SweatBot is running!"
	@echo "   Backend: http://localhost:8000"
	@echo "   Frontend: http://localhost:8005"

# Stop all services
stop:
	@echo "🛑 Stopping SweatBot services..."
	@pkill -f "uvicorn app.main:app" || true
	@pkill -f "vite" || true
	@docker-compose -f config/docker/docker-compose.yml down
	@echo "✅ All services stopped"

# Development mode (with live reload)
dev: db-start
	@echo "🔧 Starting development environment..."
	@trap 'make stop' INT; \
	cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload & \
	cd personal-ui-vite && npm run dev & \
	wait

# Run all tests
test:
	@echo "🧪 Running tests..."
	@cd backend && pytest
	@cd tests/playwright && npm test
	@echo "✅ All tests completed"

# Install all dependencies
install:
	@echo "📦 Installing dependencies..."
	@cd config/node && npm install
	@cd backend && pip install -r ../config/python/requirements.txt
	@cd personal-ui-vite && npm install
	@echo "✅ All dependencies installed"

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@rm -rf logs/*.log
	@rm -rf test-screenshots/*.png
	@echo "✅ Cleanup complete"

# Show logs
logs:
	@echo "📜 Recent logs:"
	@tail -n 20 logs/backend.log 2>/dev/null || echo "No backend logs"
	@echo "---"
	@tail -n 20 logs/frontend.log 2>/dev/null || echo "No frontend logs"

# Database operations
db-start:
	@echo "🗄️ Starting databases..."
	@docker-compose -f config/docker/docker-compose.yml up -d postgres mongodb redis
	@sleep 3
	@echo "✅ Databases ready"

db-stop:
	@echo "🗄️ Stopping databases..."
	@docker-compose -f config/docker/docker-compose.yml stop postgres mongodb redis
	@echo "✅ Databases stopped"

# Individual services
backend: db-start
	@echo "🔙 Starting backend..."
	@cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	@echo "🎨 Starting frontend..."
	@cd personal-ui-vite && npm run dev

# Docker shortcuts
docker-up:
	@docker-compose -f config/docker/docker-compose.yml up -d

docker-down:
	@docker-compose -f config/docker/docker-compose.yml down

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:8000/health || echo "❌ Backend not responding"
	@curl -s http://localhost:8005 > /dev/null && echo "✅ Frontend responding" || echo "❌ Frontend not responding"