# 🚀 SweatBot Auto-Port System

## Overview

SweatBot now features an **automatic port detection system** that eliminates "port already in use" errors. The system automatically finds available ports for both backend and frontend services, allowing multiple instances to run simultaneously.

## ✨ Features

- **Automatic Port Detection**: Finds available ports in configurable ranges
- **Zero Configuration**: No manual port settings needed
- **Conflict Resolution**: Automatically avoids ports already in use
- **Multi-Instance Support**: Run multiple SweatBot instances simultaneously
- **Cross-Platform**: Works on Windows, Linux, and macOS
- **Dynamic Configuration**: Frontend automatically connects to the correct backend port

## 🎯 Quick Start

### Windows
```batch
start_app_auto_port.bat
```

### Linux/Mac
```bash
./start_app_auto_port.sh
```

That's it! SweatBot will:
1. Find available ports automatically
2. Start the backend on an available port (8000-8010)
3. Start the frontend on an available port (3000-3010)
4. Configure them to work together
5. Open your browser to the correct URL

## 📋 How It Works

### 1. Port Detection
The system uses `scripts/find_ports.py` to scan for available ports:
- Backend range: 8000-8010 (prefers 8000)
- Frontend range: 3000-3010 (prefers 3000)

### 2. Configuration Storage
Found ports are saved to `.ports.json`:
```json
{
  "backend": 8001,
  "frontend": 3000,
  "api_url": "http://localhost:8001",
  "app_url": "http://localhost:3000"
}
```

### 3. Dynamic Frontend Configuration
The frontend automatically connects to the backend through:
- Environment variable: `NEXT_PUBLIC_API_URL`
- Generated `.env.local` file
- Dynamic URL detection in the API client

### 4. Service Startup
Services start with their assigned ports:
- Backend: `uvicorn app.main:app --port [ASSIGNED_PORT]`
- Frontend: `npm run dev -- -p [ASSIGNED_PORT]`

## 🛠️ Manual Port Selection

You can still specify ports manually if needed:

### Using the Port Finder
```bash
# Find specific port ranges
python scripts/find_ports.py --backend-start 9000 --backend-end 9010

# Save configuration
python scripts/find_ports.py --save

# Check if current ports are available
python scripts/find_ports.py --check-current
```

### Starting with Specific Ports
```bash
# Backend
cd backend
python start_server.py 8005  # Start on port 8005

# Frontend
cd frontend
PORT=3005 npm run dev -- -p 3005  # Start on port 3005
```

## 📁 File Structure

```
sweatbot/
├── scripts/
│   └── find_ports.py           # Port detection utility
├── backend/
│   └── start_server.py         # Backend server with dynamic port support
├── frontend/
│   ├── lib/api.ts              # Dynamic backend URL detection
│   └── .env.local              # Generated with backend URL
├── start_app_auto_port.bat     # Windows auto-port startup
├── start_app_auto_port.sh      # Linux/Mac auto-port startup
├── test_auto_port.py           # Test suite for auto-port system
└── .ports.json                 # Port configuration (git-ignored)
```

## 🧪 Testing

Run the test suite to verify the auto-port system:

```bash
python test_auto_port.py
```

This tests:
- Port finder utility
- Port conflict avoidance
- Configuration file generation
- Backend dynamic port support
- Startup script availability

## 🔍 Troubleshooting

### "Port finder failed"
- Ensure Python 3.8+ is installed
- Check that ports 8000-8010 and 3000-3010 are not all in use

### "Backend/Frontend not responding"
- Check the log files: `backend_[PORT].log` and `frontend_[PORT].log`
- Ensure all dependencies are installed
- Try running with different port ranges

### "Cannot connect to backend"
- Verify `.env.local` was created in the frontend directory
- Check that the backend port in `.ports.json` matches the running service
- Ensure CORS is configured correctly

## 🎮 Advanced Usage

### Running Multiple Instances

Start first instance:
```bash
./start_app_auto_port.sh
# Uses ports 8000 and 3000
```

Start second instance (in another terminal):
```bash
./start_app_auto_port.sh
# Automatically uses ports 8001 and 3001
```

### Custom Port Ranges

Modify the startup scripts to use different ranges:
```bash
python scripts/find_ports.py \
  --backend-start 9000 --backend-end 9010 \
  --frontend-start 4000 --frontend-end 4010 \
  --save
```

### Docker Support

The system works with Docker too. Set environment variables:
```yaml
environment:
  - BACKEND_PORT_ENV=8005
  - PORT=3005
```

## 🔒 Security Notes

- `.ports.json` is git-ignored to prevent conflicts
- Ports are only bound to localhost by default
- Use firewall rules for production deployments

## 📊 Port Allocation Strategy

1. **Check Preferred**: Try default ports first (8000, 3000)
2. **Scan Range**: If unavailable, scan the configured range
3. **First Available**: Use the first available port found
4. **Save Configuration**: Store for service coordination

## 🚦 Status Indicators

The startup scripts provide clear status updates:
- ✅ Green: Service started successfully
- ❌ Red: Service failed to start
- ⚠️ Yellow: Warning but continuing
- 🔍 Blue: Checking or searching

## 🎉 Benefits

- **No More Port Conflicts**: Automatically finds free ports
- **Development Friendly**: Run multiple environments simultaneously
- **CI/CD Ready**: Works in automated testing environments
- **Zero Configuration**: Just run and go
- **Debugging Support**: Each instance has separate log files

---

Made with ❤️ for hassle-free SweatBot development!