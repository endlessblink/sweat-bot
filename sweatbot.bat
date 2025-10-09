@echo off
setlocal enabledelayedexpansion

:: SweatBot - Complete Ecosystem Launcher
:: Activates backend + frontend + databases with intelligent process management

title SweatBot Launcher
color 0A

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                    SweatBot Command Center                    ║
echo ╠══════════════════════════════════════════════════════════════╣
echo ║ Quick Actions:                                            ║
echo ║   sweatbot start    - Start all services                     ║
echo ║   sweatbot stop     - Stop all services                      ║
echo ║   sweatbot dev      - Development mode with reload           ║
echo ║   sweatbot status   - Check service status                   ║
echo ║                                                            ║
echo ║ Individual Services:                                      ║
echo ║   sweatbot backend  - Backend only (port 8000)              ║
echo ║   sweatbot frontend - Frontend only (port 8005)             ║
echo ║   sweatbot db      - Databases only                        ║
echo ╠════════════════════════════════════════════════════════════╣
echo.

if "%1"=="" goto :show_help
if "%1"=="start" goto :start_all
if "%1"=="stop" goto :stop_all
if "%1"=="dev" goto :dev_mode
if "%1"=="status" goto :check_status
if "%1"=="backend" goto :start_backend
if "%1"=="frontend" goto :start_frontend
if "%1"=="db" goto :start_databases
if "%1"=="help" goto :show_help
goto :show_help

:show_help
echo.
echo Usage: sweatbot [command]
echo.
echo Commands:
echo   start     - Start all SweatBot services
echo   stop      - Stop all SweatBot services
echo   dev       - Start in development mode
echo   status    - Check service status
echo   backend   - Start backend only
echo   frontend  - Start frontend only
echo   db        - Start databases only
echo   help      - Show this help message
echo.
echo Examples:
echo   sweatbot start
echo   sweatbot dev
echo   sweatbot status
goto :end

:start_all
echo 🚀 Starting SweatBot ecosystem...
call :start_databases_silent
call :start_backend_silent
call :start_frontend_silent
call :check_status_silent
goto :end

:stop_all
echo 🛑 Stopping SweatBot services...
call :stop_all_services
goto :end

:dev_mode
echo 🔧 Starting SweatBot in development mode...
call :start_databases_silent
call :start_backend_dev
call :start_frontend_dev
goto :end

:check_status
echo 🏥 Checking SweatBot service status...
call :check_status_detailed
goto :end

:start_backend
echo 🔙 Starting backend service...
call :start_databases_silent
call :start_backend_silent
goto :end

:start_frontend
echo 🎨 Starting frontend service...
call :start_frontend_silent
goto :end

:start_databases
echo 🗄️ Starting database services...
call :start_databases_silent
goto :end

:: ===== SERVICE MANAGEMENT FUNCTIONS =====

:start_databases_silent
echo 🗄️ Starting databases...
cd /d "%~dp0" && docker-compose -f config/docker/docker-compose.yml up -d postgres mongodb redis >nul 2>&1
timeout /t 3 >nul
goto :eof

:start_backend_silent
echo 🔙 Starting backend...
cd /d "%~dp0\backend" && start /B python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1
timeout /t 2 >nul
goto :eof

:start_backend_dev
echo 🔙 Starting backend in dev mode...
cd /d "%~dp0\backend" && start /B python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1
goto :eof

:start_frontend_silent
echo 🎨 Starting frontend...
cd /d "%~dp0\personal-ui-vite" && start /B npm run dev > ../logs/frontend.log 2>&1
timeout /t 3 >nul
goto :eof

:start_frontend_dev
echo 🎨 Starting frontend in dev mode...
cd /d "%~dp0\personal-ui-vite" && start /B npm run dev > ../logs/frontend.log 2>&1
goto :eof

:stop_all_services
echo 🛑 Stopping all services...
taskkill /F /IM "uvicorn app.main:app" >nul 2>&1
taskkill /F /IM "vite" >nul 2>&1
docker-compose -f config/docker/docker-compose.yml down >nul 2>&1
echo ✅ All services stopped
goto :eof

:check_status_silent
echo 🏥 Checking service status...
timeout /t 1 >nul
goto :eof

:check_status_detailed
echo.
echo 📊 Service Status Report:
echo ──────────────────────────────────
echo.

:: Check backend
netstat -an | findstr ":8000" >nul
if %errorlevel%==0 (
    echo ✅ Backend: RUNNING (http://localhost:8000)
) else (
    echo ❌ Backend: STOPPED
)

:: Check frontend
netstat -an | findstr ":8005" >nul
if %errorlevel%==0 (
    echo ✅ Frontend: RUNNING (http://localhost:8005)
) else (
    echo ❌ Frontend: STOPPED
)

:: Check databases
docker-compose -f config/docker/docker-compose.yml ps postgres mongodb redis >nul 2>&1
echo %errorlevel% | findstr "Up" >nul
if %errorlevel%==0 (
    echo ✅ Databases: RUNNING
) else (
    echo ❌ Databases: STOPPED
)

echo ──────────────────────────────────
echo.
goto :eof

:end
echo.
echo ✨ SweatBot operation completed!
echo.
pause