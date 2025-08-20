@echo off
setlocal enabledelayedexpansion

REM SweatBot Hebrew Fitness AI Tracker - One-Click Startup for Windows
title SweatBot - Hebrew Fitness AI Tracker

echo ================================================
echo 🚀 SweatBot Hebrew Fitness AI Tracker
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

REM Check if ports are free
echo 🔍 Checking ports...
netstat -an | findstr :8000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 8000 is already in use
    choice /M "Try to kill process on port 8000"
    if !errorlevel! equ 1 (
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        echo Process killed
    )
)

netstat -an | findstr :3000 | findstr LISTENING >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Port 3000 is already in use
    choice /M "Try to kill process on port 3000"
    if !errorlevel! equ 1 (
        for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
            taskkill /F /PID %%a >nul 2>&1
        )
        echo Process killed
    )
)

echo ✅ Ports are available
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

REM Start backend
echo.
echo 🚀 Starting backend server...
start /B cmd /c "python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 >../backend.log 2>&1"
echo ✅ Backend started on http://localhost:8000

REM Move to frontend
cd ..\frontend

REM Check frontend dependencies
if not exist node_modules (
    echo.
    echo 📦 Installing frontend dependencies...
    call npm install --silent
    if %errorlevel% neq 0 (
        echo ⚠️  Some npm packages may not have installed
    )
)

REM Start frontend
echo.
echo 🚀 Starting frontend server...
start /B cmd /c "npm run dev >../frontend.log 2>&1"
echo ✅ Frontend started on http://localhost:3000

REM Wait for services
echo.
echo ⏳ Waiting for services to start...
timeout /t 8 /nobreak >nul

REM Check if services are running
echo.
echo ================================================
echo 📊 SweatBot Status
echo ================================================

REM Check backend
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API: http://localhost:8000
    echo    API Docs: http://localhost:8000/docs
) else (
    echo ❌ Backend is not responding
    echo    Check backend.log for errors
)

REM Check frontend
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend App: http://localhost:3000
) else (
    echo ❌ Frontend is not responding
    echo    Check frontend.log for errors
)

echo.
echo ================================================
echo 💡 Quick Tips:
echo ================================================
echo • Voice Commands: Hold mic button and say 'עשיתי 20 סקוואטים'
echo • View Backend Logs: type backend.log
echo • View Frontend Logs: type frontend.log
echo • Test API: python test_complete_app.py
echo.

REM Open browser
echo 🌐 Opening SweatBot in your browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000

echo.
echo 🎉 SweatBot is ready!
echo.
echo Press any key to stop all services and exit...
pause >nul

REM Kill processes
echo.
echo Stopping services...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo Services stopped.
pause