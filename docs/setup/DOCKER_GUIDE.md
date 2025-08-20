# 🐳 SweatBot Docker Guide

## Overview

SweatBot now runs **ENTIRELY IN DOCKER CONTAINERS** - no more local Python virtual environments or node_modules! Everything is clean, isolated, and consistent.

## ✨ Benefits of Docker-Only Approach

- **🧹 Clean Host System** - No Python packages or node_modules installed locally
- **📦 Consistent Environment** - Same versions for everyone
- **🚀 Fast Setup** - Pre-built images with all dependencies
- **🔒 Isolated** - Each service in its own container
- **♻️ Easy Cleanup** - One command removes everything
- **🎯 Production-Ready** - Same setup for development and production

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed ([docker.com](https://docker.com))
- Python 3 (only for port detection script)

### One-Command Startup

**Windows:**
```batch
docker-start.bat
```

**Linux/Mac:**
```bash
./docker-start.sh
```

That's it! The script will:
1. Find available ports automatically
2. Build all containers (first time only)
3. Start all services
4. Open your browser
5. Display URLs and status

## 📋 What Gets Installed Where

### On Your Host Machine (Local)
- **NOTHING!** Just your source code files

### Inside Docker Containers
- **Backend Container**: Python, FastAPI, SQLAlchemy, Whisper, all Python packages
- **Frontend Container**: Node.js, Next.js, React, all npm packages
- **Database Container**: PostgreSQL with all data
- **Redis Container**: Redis cache

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                 Docker Network                   │
├─────────────────────────────────────────────────┤
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Frontend │  │ Backend  │  │ Database │      │
│  │  :3000   │─▶│  :8000   │─▶│  :5432   │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                      │                           │
│                      ▼                           │
│                ┌──────────┐                      │
│                │  Redis   │                      │
│                │  :6379   │                      │
│                └──────────┘                      │
└─────────────────────────────────────────────────┘
        ▲               ▲               ▲
        │               │               │
    Browser         API Docs      Port Mapping
  localhost:3000  localhost:8000   (Dynamic)
```

## 🔧 Configuration

### Automatic Port Detection
The system automatically finds available ports:
- Backend: 8000-8010
- Frontend: 3000-3010
- PostgreSQL: 5432-5442
- Redis: 6379-6389

### Manual Configuration
Edit `.env.docker` (auto-generated) to customize:
```env
BACKEND_PORT=8001
FRONTEND_PORT=3000
# ... other settings
```

## 📝 Common Docker Commands

### View Logs
```bash
# All services
docker compose -f docker-compose.auto.yml logs -f

# Specific service
docker compose -f docker-compose.auto.yml logs -f backend
docker compose -f docker-compose.auto.yml logs -f frontend
```

### Enter Container Shell
```bash
# Backend (Python environment)
docker exec -it sweatbot_backend bash

# Frontend (Node environment)
docker exec -it sweatbot_frontend sh

# Database
docker exec -it sweatbot_postgres psql -U fitness_user -d hebrew_fitness
```

### Manage Services
```bash
# Stop all services
docker compose -f docker-compose.auto.yml down

# Stop and remove volumes (full cleanup)
docker compose -f docker-compose.auto.yml down -v

# Restart a service
docker compose -f docker-compose.auto.yml restart backend

# Rebuild after code changes
docker compose -f docker-compose.auto.yml build
```

### Database Operations
```bash
# Backup database
docker exec sweatbot_postgres pg_dump -U fitness_user hebrew_fitness > backup.sql

# Restore database
docker exec -i sweatbot_postgres psql -U fitness_user hebrew_fitness < backup.sql
```

## 🔍 Troubleshooting

### "Docker is not running"
- Start Docker Desktop
- On Linux: `sudo systemctl start docker`

### "Port already in use"
- The script automatically finds available ports
- Or manually specify in `.env.docker`

### "Container not starting"
```bash
# Check logs
docker compose -f docker-compose.auto.yml logs backend

# Rebuild from scratch
docker compose -f docker-compose.auto.yml down -v
docker compose -f docker-compose.auto.yml build --no-cache
docker compose -f docker-compose.auto.yml up
```

### "Changes not reflecting"
- Frontend/Backend code changes should hot-reload
- For dependency changes, rebuild: `docker compose -f docker-compose.auto.yml build`

### "Database connection error"
```bash
# Check if database is running
docker ps | grep postgres

# Check database logs
docker logs sweatbot_postgres

# Reset database
docker compose -f docker-compose.auto.yml down -v
docker compose -f docker-compose.auto.yml up
```

## 🧹 Complete Cleanup

To remove EVERYTHING (containers, volumes, images):
```bash
# Stop and remove containers, networks, volumes
docker compose -f docker-compose.auto.yml down -v

# Remove images
docker rmi $(docker images -q sweatbot_*)

# Remove all Docker data (WARNING: affects all Docker projects)
docker system prune -a --volumes
```

## 📁 File Structure

```
sweatbot/
├── docker-compose.auto.yml   # Dynamic port Docker config
├── docker-start.bat          # Windows Docker startup
├── docker-start.sh           # Linux/Mac Docker startup
├── .env.docker              # Auto-generated config (git-ignored)
├── .env.docker.example      # Template for manual config
├── scripts/
│   └── docker_ports.py      # Port detection utility
├── backend/
│   ├── Dockerfile           # Backend container definition
│   ├── requirements.txt     # Python dependencies
│   └── app/                 # Source code (mounted)
└── frontend/
    ├── Dockerfile           # Frontend container definition
    ├── package.json         # Node dependencies
    └── app/                 # Source code (mounted)
```

## 🚫 What NOT to Do

- **DON'T** run `pip install` locally
- **DON'T** run `npm install` locally
- **DON'T** create Python virtual environments
- **DON'T** use the old `start_app.sh` or `start_app.bat` scripts

## ✅ What TO Do

- **DO** use Docker for everything
- **DO** add new dependencies to `requirements.txt` or `package.json`
- **DO** rebuild containers after adding dependencies
- **DO** use Docker commands for debugging

## 🎯 Development Workflow

1. **Start Services**
   ```bash
   ./docker-start.sh
   ```

2. **Make Code Changes**
   - Edit files normally
   - Changes auto-reload in containers

3. **Add Dependencies**
   ```bash
   # Backend: Edit backend/requirements.txt
   # Frontend: Edit frontend/package.json
   # Then rebuild:
   docker compose -f docker-compose.auto.yml build
   ```

4. **Run Tests**
   ```bash
   # Backend tests
   docker exec sweatbot_backend pytest

   # Frontend tests
   docker exec sweatbot_frontend npm test
   ```

5. **Stop Services**
   ```bash
   docker compose -f docker-compose.auto.yml down
   ```

## 🌟 Advanced Features

### Production Build
```bash
# Use production Dockerfile targets
docker compose -f docker-compose.yml up --build
```

### Custom Network
```yaml
# In docker-compose.auto.yml
networks:
  sweatbot_network:
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Volume Persistence
Data persists in Docker volumes:
- `postgres_data` - Database data
- `redis_data` - Cache data
- `whisper_models` - AI models

### Health Checks
All services include health checks:
```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## 🎉 Advantages Over Local Installation

| Local Installation | Docker Containers |
|-------------------|-------------------|
| Pollutes system with packages | Clean, isolated environment |
| Version conflicts | Consistent versions |
| Manual dependency management | Automated via Dockerfile |
| Different on each machine | Identical everywhere |
| Hard to clean up | One command cleanup |
| Setup takes 20+ minutes | Setup takes 2 minutes |

## 📞 Getting Help

If you encounter issues:

1. Check the logs: `docker compose -f docker-compose.auto.yml logs`
2. Verify Docker is running: `docker ps`
3. Try rebuilding: `docker compose -f docker-compose.auto.yml build --no-cache`
4. Reset everything: `docker compose -f docker-compose.auto.yml down -v`

---

**Remember: Everything runs in Docker now. No local installations needed!** 🐳