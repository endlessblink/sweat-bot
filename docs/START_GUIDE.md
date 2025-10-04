# SweatBot Unified Launch System

## Quick Start

The new unified launch system makes starting SweatBot simple and reliable:

```bash
# Interactive mode (recommended for first-time users)
./start-sweatbot.sh

# Quick minimal startup (fastest - ~2 minutes)
./start-sweatbot.sh --mode=minimal

# Full featured startup (complete system - ~10 minutes)
./start-sweatbot.sh --mode=full

# Frontend only (assumes backend is running)
./start-sweatbot.sh --frontend-only
```

## Launch Modes

### 🚀 Minimal Mode
**Best for:** Quick testing, development, first-time setup
**Startup time:** ~2 minutes
**Features:**
- ✅ AI Chat Agent (Hebrew + English)
- ✅ Exercise Database (PostgreSQL)
- ✅ Statistics Retrieval  
- ✅ Exercise Logging
- ❌ Voice Processing
- ❌ Conversation Memory
- ❌ Audio Features

```bash
./start-sweatbot.sh --mode=minimal
```

### 🎯 Standard Mode
**Best for:** Full functionality with reasonable startup time
**Startup time:** ~5 minutes
**Features:**
- ✅ All Minimal mode features
- ✅ Conversation Memory (MongoDB)
- ✅ Session Caching (Redis)
- ✅ Voice Processing Support
- ✅ Basic Audio Processing
- ❌ Heavy ML Models

```bash
./start-sweatbot.sh --mode=standard
```

### 🔥 Full Mode
**Best for:** Complete feature set including ML models
**Startup time:** ~10 minutes
**Features:**
- ✅ All Standard mode features
- ✅ PyTorch ML Models
- ✅ Advanced Audio Processing
- ✅ Voice Recognition (Whisper)
- ✅ Complete Transformers Support

```bash
./start-sweatbot.sh --mode=full
```

### 🖥️ Frontend Only Mode
**Best for:** UI development when backend is already running
**Startup time:** ~1 minute
**Features:**
- ✅ React Frontend UI
- ✅ Connects to existing backend services

```bash
./start-sweatbot.sh --frontend-only
```

## Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `--mode=MODE` | Set launch mode: minimal, standard, full, interactive | `--mode=standard` |
| `--debug` | Enable debug output for troubleshooting | `--debug` |
| `--force-reinstall` | Force reinstallation of all dependencies | `--force-reinstall` |
| `--skip-databases` | Skip database setup (use existing containers) | `--skip-databases` |
| `--frontend-only` | Start only frontend (assumes backend running) | `--frontend-only` |
| `--help`, `-h` | Show help message | `--help` |

## Usage Examples

### Development Workflow
```bash
# First time setup - full interactive experience
./start-sweatbot.sh

# Quick daily development - minimal mode
./start-sweatbot.sh --mode=minimal

# Frontend development - backend already running
./start-sweatbot.sh --frontend-only

# Debugging issues - enable debug output
./start-sweatbot.sh --mode=standard --debug
```

### Production Deployment
```bash
# Complete production setup
./start-sweatbot.sh --mode=full

# Force clean installation
./start-sweatbot.sh --mode=full --force-reinstall
```

### Troubleshooting
```bash
# Debug mode with detailed output
./start-sweatbot.sh --debug

# Skip database setup if containers already exist
./start-sweatbot.sh --skip-databases

# Get help
./start-sweatbot.sh --help
```

## Port Allocation

SweatBot strictly uses ports **8000-8005** only:

| Service | Port Range | Description |
|---------|------------|-------------|
| Backend API | 8000-8001 | FastAPI server with runtime fallback |
| Agent Service | 8001-8003 | AI agent with tool-based architecture |
| Frontend UI | 8004-8005 | Vite React development server |

**Database ports (separate range):**
- PostgreSQL: 5434
- MongoDB: 27017  
- Redis: 6379-6389 (auto-allocated)

## Service Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │───▶│   Agent Service │───▶│   Backend API   │
│   (React/Vite)  │    │   (FastAPI)     │    │   (FastAPI)     │
│   Port 8004+    │    │   Port 8001+    │    │   Port 8000+    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MongoDB       │    │   PostgreSQL    │
                       │   (Conversations)│    │   (Exercise Data)│
                       │   Port 27017    │    │   Port 5434     │
                       └─────────────────┘    └─────────────────┘
```

## Health Monitoring

The script includes comprehensive health checks:

### Automatic Checks
- ✅ Database connectivity (PostgreSQL, MongoDB, Redis)
- ✅ Service responsiveness (Backend, Agent, Frontend)
- ✅ Port availability and conflict resolution
- ✅ Python environment and package verification

### Manual Health Check
```bash
# Check individual services
curl http://localhost:8000/health      # Backend API
curl http://localhost:8001/health      # Agent Service
curl http://localhost:8004             # Frontend UI

# Database connectivity
pg_isready -h localhost -p 5434 -U fitness_user    # PostgreSQL
nc -z localhost 27017                              # MongoDB
```

## Log Files

All services generate detailed logs:

| Service | Log File | Command to View |
|---------|----------|----------------|
| Launch Script | `sweatbot-launch.log` | `tail -f sweatbot-launch.log` |
| Backend API | `backend.log` | `tail -f backend.log` |
| Agent Service | `agent.log` | `tail -f agent.log` |
| Frontend UI | `frontend.log` | `tail -f frontend.log` |

## Troubleshooting Guide

### Common Issues

#### 1. "Docker not running"
```bash
# Linux/WSL2
sudo systemctl start docker

# macOS
open /Applications/Docker.app

# Windows
# Start Docker Desktop from Start Menu
```

#### 2. "Port already in use"
```bash
# The script will automatically clean up SweatBot services
# For manual cleanup:
lsof -ti:8000 | xargs kill -9  # Kill process on port 8000
```

#### 3. "Package installation failed"
```bash
# Force clean reinstall
./start-sweatbot.sh --mode=minimal --force-reinstall --debug
```

#### 4. "Frontend not loading"
```bash
# Check if node_modules exists and package manager is available
cd personal-ui-vite
npm install  # or: bun install
cd ..
./start-sweatbot.sh --frontend-only
```

#### 5. "Database connection failed"
```bash
# Check Docker containers
docker ps | grep sweatbot
docker logs sweatbot_postgres
docker logs sweatbot_mongodb
```

### Debug Mode

Enable detailed debugging output:
```bash
./start-sweatbot.sh --debug
```

Debug mode shows:
- Port scanning details
- Package installation progress
- Service startup sequence
- Database connection attempts
- Health check results

### Recovery Procedures

#### Complete Reset
```bash
# Stop all services
docker stop sweatbot_postgres sweatbot_mongodb sweatbot_redis
docker rm sweatbot_postgres sweatbot_mongodb sweatbot_redis

# Clean Python environment
rm -rf backend/venv

# Fresh start
./start-sweatbot.sh --mode=standard --force-reinstall
```

#### Partial Reset (Keep Data)
```bash
# Keep databases, reinstall Python packages
./start-sweatbot.sh --mode=standard --force-reinstall --skip-databases
```

## Performance Optimization

### Startup Time Optimization
- **Minimal Mode**: Skip heavy dependencies for fastest startup
- **Standard Mode**: Balance between features and speed
- **Frontend Only**: Develop UI without backend overhead

### Resource Usage
| Mode | RAM Usage | Disk Space | Startup Time |
|------|-----------|------------|--------------|
| Minimal | ~2GB | ~1GB | 2 minutes |
| Standard | ~4GB | ~3GB | 5 minutes |
| Full | ~8GB | ~8GB | 10 minutes |

### Development Tips
1. Use **Minimal Mode** for backend API development
2. Use **Frontend Only** for UI development
3. Use **Standard Mode** for integration testing
4. Use **Full Mode** for production deployment

## Migration from Old Scripts

### Old Script → New Script Mapping
```bash
# Old way
./launch-sweatbot-minimal.sh
# New way
./start-sweatbot.sh --mode=minimal

# Old way
./launch-sweatbot-fixed.sh
# New way
./start-sweatbot.sh --mode=standard

# Old way
./launch-sweatbot.sh
# New way
./start-sweatbot.sh --mode=full
```

### Benefits of New System
- 🚀 **Faster**: Smart dependency detection
- 🛡️ **Safer**: Comprehensive error handling
- 🎯 **Flexible**: Multiple modes for different needs
- 🔍 **Debuggable**: Detailed logging and health checks
- 📖 **Documented**: Clear usage instructions

## Support

### Getting Help
```bash
# Show help
./start-sweatbot.sh --help

# Debug output
./start-sweatbot.sh --debug

# Check logs
tail -f sweatbot-launch.log
```

### Reporting Issues
When reporting issues, please include:
1. Launch command used
2. Contents of `sweatbot-launch.log`
3. System information (OS, Docker version)
4. Error messages from log files

---

**Happy SweatBot Development! 💪🤖**