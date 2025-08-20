@echo off
setlocal enabledelayedexpansion

REM SweatBot Hebrew Fitness AI Tracker - Auto-Port Startup for Windows
REM Automatically finds available ports and starts the application
title SweatBot - Hebrew Fitness AI Tracker (Auto-Port)

echo ================================================
echo 🚀 SweatBot Hebrew Fitness AI Tracker
echo    Auto-Port Detection Enabled
echo ================================================
echo.

REM Check Python
echo 🔍 Checking dependencies...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js 16+ from nodejs.org
    pause
    exit /b 1
)

echo ✅ Dependencies found
echo.

REM Find available ports
echo 🔍 Finding available ports...
python scripts\find_ports.py --save --check-current > temp_ports.txt 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error finding available ports
    type temp_ports.txt
    del temp_ports.txt
    pause
    exit /b 1
)

REM Read port configuration
for /f "tokens=2 delims=:" %%a in ('findstr "Backend:" temp_ports.txt') do (
    set BACKEND_PORT=%%a
)
for /f "tokens=2 delims=:" %%a in ('findstr "Frontend:" temp_ports.txt') do (
    set FRONTEND_PORT=%%a
)

REM Clean up port numbers (remove spaces)
set BACKEND_PORT=!BACKEND_PORT: =!
set FRONTEND_PORT=!FRONTEND_PORT: =!

REM Extract just the port number if URL is included
for /f "tokens=1 delims=(" %%a in ("!BACKEND_PORT!") do set BACKEND_PORT=%%a
for /f "tokens=1 delims=(" %%a in ("!FRONTEND_PORT!") do set FRONTEND_PORT=%%a

REM Clean up temp file
del temp_ports.txt

if "!BACKEND_PORT!"=="" (
    echo ❌ Could not determine backend port
    pause
    exit /b 1
)
if "!FRONTEND_PORT!"=="" (
    echo ❌ Could not determine frontend port
    pause
    exit /b 1
)

echo ✅ Found available ports:
echo    Backend:  !BACKEND_PORT!
echo    Frontend: !FRONTEND_PORT!
echo.

REM Initialize database
echo 🗄️ Initializing database...
if exist scripts\init_db.py (
    python scripts\init_db.py 2>nul
    if %errorlevel% neq 0 (
        echo ⚠️  Database initialization had issues - may already exist
    ) else (
        echo ✅ Database initialized
    )
) else (
    echo ⚠️  Database init script not found
)
echo.

REM Check backend dependencies
echo 📦 Checking backend dependencies...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  Could not activate virtual environment
)

REM Check if FastAPI is installed
python -c "import fastapi" 2>nul
if %errorlevel% neq 0 (
    echo Installing Python dependencies...
    pip install fastapi uvicorn sqlalchemy asyncpg pydantic python-jose passlib aioredis >nul 2>&1
    if %errorlevel% neq 0 (
        echo ⚠️  Some Python packages may not have installed
    )
)

REM Start backend with dynamic port
echo.
echo 🚀 Starting backend server on port !BACKEND_PORT!...
set BACKEND_PORT_ENV=!BACKEND_PORT!
start /B cmd /c "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port !BACKEND_PORT! >../backend_!BACKEND_PORT!.log 2>&1"
echo ✅ Backend starting on http://localhost:!BACKEND_PORT!

REM Move to frontend
cd ..\frontend

REM Create .env.local with backend URL
echo Creating frontend configuration...
echo NEXT_PUBLIC_API_URL=http://localhost:!BACKEND_PORT!> .env.local
echo NEXT_PUBLIC_WS_URL=ws://localhost:!BACKEND_PORT!>> .env.local

REM Check frontend dependencies
if not exist node_modules (
    echo.
    echo 📦 Installing frontend dependencies...
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ⚠️  Some npm packages may not have installed
    )
)

REM Start frontend with dynamic port
echo.
echo 🚀 Starting frontend server on port !FRONTEND_PORT!...
set PORT=!FRONTEND_PORT!
start /B cmd /c "npm run dev -- -p !FRONTEND_PORT! >../frontend_!FRONTEND_PORT!.log 2>&1"
echo ✅ Frontend starting on http://localhost:!FRONTEND_PORT!

REM Wait for services
echo.
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are running
echo.
echo ================================================
echo 📊 SweatBot Status
echo ================================================

REM Check backend
curl -s http://localhost:!BACKEND_PORT!/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API: http://localhost:!BACKEND_PORT!
    echo    API Docs: http://localhost:!BACKEND_PORT!/docs
) else (
    echo ❌ Backend is not responding on port !BACKEND_PORT!
    echo    Check backend_!BACKEND_PORT!.log for errors
)

REM Check frontend
curl -s http://localhost:!FRONTEND_PORT! >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend App: http://localhost:!FRONTEND_PORT!
) else (
    echo ❌ Frontend is not responding on port !FRONTEND_PORT!
    echo    Check frontend_!FRONTEND_PORT!.log for errors
)

echo.
echo ================================================
echo 💡 Configuration
echo ================================================
echo Backend Port:  !BACKEND_PORT!
echo Frontend Port: !FRONTEND_PORT!
echo Port config saved in: .ports.json
echo.
echo ================================================
echo 💡 Quick Tips:
echo ================================================
echo • Voice Commands: Hold mic button and say 'עשיתי 20 סקוואטים'
echo • View Backend Logs: type backend_!BACKEND_PORT!.log
echo • View Frontend Logs: type frontend_!FRONTEND_PORT!.log
echo • Test API: python test_complete_app.py
echo.

REM Open browser
echo 🌐 Opening SweatBot in your browser...
timeout /t 2 /nobreak >nul
start http://localhost:!FRONTEND_PORT!

echo.
echo 🎉 SweatBot is ready on custom ports!
echo    Frontend: http://localhost:!FRONTEND_PORT!
echo    Backend:  http://localhost:!BACKEND_PORT!
echo.
echo Press any key to stop all services and exit...
pause >nul

REM Kill processes
echo.
echo Stopping services...

REM Find and kill backend process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :!BACKEND_PORT! ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Find and kill frontend process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :!FRONTEND_PORT! ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

REM Clean up port configuration
del ..\frontend\.env.local 2>nul

echo Services stopped.
pause