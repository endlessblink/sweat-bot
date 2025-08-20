@echo off
echo ===========================================
echo SweatBot Hebrew Fitness AI Tracker
echo ===========================================
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.11+ first.
    pause
    exit /b 1
)

echo 📋 Starting SweatBot Backend...
echo.

REM Change to project directory
cd /d "%~dp0"

REM Initialize database if needed
echo 🔨 Initializing database...
python scripts\init_db.py
if %errorlevel% neq 0 (
    echo ⚠️  Database initialization had issues, but continuing...
)
echo.

REM Start the backend server
echo 🚀 Starting FastAPI backend on http://localhost:8000
echo 📖 API docs will be available at http://localhost:8000/docs
echo 🏥 Health check at http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo.

cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

echo.
echo Backend stopped.
pause