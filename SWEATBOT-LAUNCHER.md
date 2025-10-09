# SweatBot Launcher - Complete Ecosystem Management

## 🚀 Quick Start

Now you can control the entire SweatBot ecosystem with a single command!

### Available Commands

```bash
# Start all services
npm run start

# Stop all services  
npm run stop

# Development mode with live reload
npm run dev

# Check service status
npm run status

# Individual services
npm run backend    # Backend only (port 8000)
npm run frontend   # Frontend only (port 8005)
npm run db         # Databases only

# View logs
npm run logs

# Clean up
npm run clean
```

## 📁 Files Created

1. **`sweatbot.sh`** - Cross-platform shell script (Linux/macOS)
2. **`sweatbot.bat`** - Windows batch file
3. **`sweatbot.ps1`** - PowerShell script (Windows)
4. **`package.json`** - Updated with npm scripts
5. **`logs/`** - Directory for service logs

## 🎯 Features

### ✅ Smart Process Management
- **Auto-detection**: Checks if services are already running
- **Port monitoring**: Uses `ss`/`netstat` to verify service status
- **PID tracking**: Stores process IDs for clean shutdown
- **Error handling**: Graceful handling of port conflicts and missing dependencies

### ✅ Complete Service Stack
- **Backend**: FastAPI server (port 8000)
- **Frontend**: Vite dev server (port 8005)  
- **Databases**: PostgreSQL, MongoDB, Redis (via Docker)
- **Logging**: Centralized logs in `logs/` directory

### ✅ Cross-Platform Support
- **Linux/macOS**: Uses `sweatbot.sh`
- **Windows**: Uses `sweatbot.bat` or `sweatbot.ps1`
- **npm scripts**: Work across all platforms

## 🔧 Usage Examples

### Start Everything
```bash
npm run start
```
Output:
```
🚀 Starting SweatBot ecosystem...
🗄️ Starting databases...
🔙 Starting backend...
🎨 Starting frontend...

📊 Service Status Report:
──────────────────────────────────
✅ Backend: RUNNING (http://localhost:8000)
✅ Frontend: RUNNING (http://localhost:8005)
✅ Databases: RUNNING
──────────────────────────────────
```

### Check Status
```bash
npm run status
```

### Development Mode
```bash
npm run dev
```

### Stop Everything
```bash
npm run stop
```

## 📊 Service URLs

When running, access services at:
- **Frontend**: http://localhost:8005
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🔍 Troubleshooting

### Port Already in Use
The launcher detects existing services and won't start duplicates. If you need to force restart:

```bash
npm run stop
npm run start
```

### Check Logs
```bash
# View all logs
npm run logs

# View specific logs
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Manual Process Management
If the launcher fails, you can manually manage processes:

```bash
# Stop processes
pkill -f "uvicorn app.main:app"
pkill -f "vite"

# Start databases
docker-compose -f config/docker/docker-compose.yml up -d

# Start backend
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Start frontend  
cd personal-ui-vite && npm run dev
```

## 🛠️ Advanced Usage

### Custom Environment Variables
The launcher respects existing environment variables:
- `VITE_OPENAI_API_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_BACKEND_URL`

### Docker Integration
The launcher automatically manages Docker containers for databases:
- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Redis (port 6379)

### Development Workflow
1. `npm run dev` - Start in development mode
2. Make changes to code
3. Services auto-reload
4. `npm run status` - Check if everything is running
5. `npm run stop` - Clean shutdown when done

## 📝 Notes

- The launcher creates `logs/` directory automatically
- Process IDs are stored in `logs/backend.pid` and `logs/frontend.pid`
- All services run in background mode
- The launcher handles cleanup on shutdown
- Compatible with the existing Makefile commands

## 🎉 Benefits

1. **One-command startup** - No more managing multiple terminals
2. **Intelligent status checking** - Know exactly what's running
3. **Clean shutdown** - Properly stops all services
4. **Cross-platform** - Works on Windows, Linux, and macOS
5. **Error prevention** - Avoids port conflicts and duplicate processes
6. **Centralized logging** - All logs in one place
7. **Development friendly** - Supports hot reload and dev mode

Now you can focus on building features instead of managing services! 🚀