@echo off
setlocal enabledelayedexpansion

REM SweatBot Docker-Only Startup - NO LOCAL INSTALLATIONS!
title SweatBot - Docker Container System

echo ================================================
echo 🐳 SweatBot Hebrew Fitness AI Tracker
echo    Docker Container System
echo    NO LOCAL INSTALLATIONS!
echo ================================================
echo.

REM Check Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop from docker.com
    pause
    exit /b 1
)

REM Check Docker Compose
docker compose version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please ensure Docker Desktop is properly installed
    pause
    exit /b 1
)

echo ✅ Docker is ready
echo.

REM Find available ports
echo 🔍 Finding available ports...
python scripts\docker_ports.py
if %errorlevel% neq 0 (
    echo ❌ Failed to find available ports
    echo Make sure Python is installed for port detection
    pause
    exit /b 1
)

REM Read port configuration
if not exist .docker-ports.json (
    echo ❌ Port configuration not found
    pause
    exit /b 1
)

REM Parse JSON to get ports (using PowerShell for JSON parsing)
for /f "delims=" %%i in ('powershell -Command "Get-Content .docker-ports.json | ConvertFrom-Json | Select -ExpandProperty backend"') do set BACKEND_PORT=%%i
for /f "delims=" %%i in ('powershell -Command "Get-Content .docker-ports.json | ConvertFrom-Json | Select -ExpandProperty frontend"') do set FRONTEND_PORT=%%i

echo.
echo 📦 Building Docker containers...
echo    This may take a few minutes on first run...
echo.

REM Build and start containers
docker compose -f docker-compose.auto.yml build
if %errorlevel% neq 0 (
    echo ❌ Docker build failed
    pause
    exit /b 1
)

echo.
echo 🚀 Starting SweatBot services...
docker compose -f docker-compose.auto.yml up -d
if %errorlevel% neq 0 (
    echo ❌ Failed to start Docker containers
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to be healthy...
timeout /t 10 /nobreak >nul

REM Check container status
echo.
echo ================================================
echo 📊 SweatBot Container Status
echo ================================================

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | findstr sweatbot

echo.
echo ================================================
echo 🌐 SweatBot URLs
echo ================================================
echo.
echo 📱 Frontend App:  http://localhost:!FRONTEND_PORT!
echo 🔧 Backend API:   http://localhost:!BACKEND_PORT!
echo 📚 API Docs:      http://localhost:!BACKEND_PORT!/docs
echo 🗄️ PostgreSQL:    localhost:5432
echo 💾 Redis:         localhost:6379
echo.
echo ================================================
echo 💡 Docker Commands
echo ================================================
echo.
echo View logs:        docker compose -f docker-compose.auto.yml logs -f
echo Stop services:    docker compose -f docker-compose.auto.yml down
echo Clean everything: docker compose -f docker-compose.auto.yml down -v
echo Rebuild:          docker compose -f docker-compose.auto.yml build --no-cache
echo.

REM Open browser
echo 🌐 Opening SweatBot in your browser...
timeout /t 2 /nobreak >nul
start http://localhost:!FRONTEND_PORT!

echo.
echo ✅ SweatBot is running in Docker containers!
echo.
echo Press any key to stop all containers...
pause >nul

REM Stop containers
echo.
echo 🛑 Stopping Docker containers...
docker compose -f docker-compose.auto.yml down

echo.
echo Containers stopped. Press any key to exit...
pause