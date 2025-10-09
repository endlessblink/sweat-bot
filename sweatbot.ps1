# SweatBot PowerShell Launcher
# Complete ecosystem management for SweatBot AI Assistant

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("start", "stop", "dev", "status", "backend", "frontend", "db", "help")]
    [string]$Command = "help"
)

function Write-Header {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                    SweatBot Command Center                    ║" -ForegroundColor Cyan
    Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host "║ Quick Actions:                                            ║" -ForegroundColor White
    Write-Host "║   sweatbot start    - Start all services                     ║" -ForegroundColor White
    Write-Host "║   sweatbot stop     - Stop all services                      ║" -ForegroundColor White
    Write-Host "║   sweatbot dev      - Development mode with reload           ║" -ForegroundColor White
    Write-Host "║   sweatbot status   - Check service status                   ║" -ForegroundColor White
    Write-Host "║                                                            ║" -ForegroundColor White
    Write-Host "║ Individual Services:                                      ║" -ForegroundColor White
    Write-Host "║   sweatbot backend  - Backend only (port 8000)              ║" -ForegroundColor White
    Write-Host "║   sweatbot frontend - Frontend only (port 8005)             ║" -ForegroundColor White
    Write-Host "║   sweatbot db      - Databases only                        ║" -ForegroundColor White
    Write-Host "╠════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Help {
    Write-Header
    Write-Host "Usage: .\sweatbot.ps1 [command]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  start     - Start all SweatBot services" -ForegroundColor Green
    Write-Host "  stop      - Stop all SweatBot services" -ForegroundColor Red
    Write-Host "  dev       - Start in development mode" -ForegroundColor Yellow
    Write-Host "  status    - Check service status" -ForegroundColor Blue
    Write-Host "  backend   - Start backend only" -ForegroundColor Cyan
    Write-Host "  frontend  - Start frontend only" -ForegroundColor Magenta
    Write-Host "  db        - Start databases only" -ForegroundColor Gray
    Write-Host "  help      - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\sweatbot.ps1 start" -ForegroundColor Gray
    Write-Host "  .\sweatbot.ps1 dev" -ForegroundColor Gray
    Write-Host "  .\sweatbot.ps1 status" -ForegroundColor Gray
}

function Start-Databases {
    Write-Host "🗄️ Starting databases..." -ForegroundColor Gray
    Set-Location $PSScriptRoot
    docker-compose -f config/docker/docker-compose.yml up -d postgres mongodb redis
    Start-Sleep -Seconds 3
}

function Start-Backend {
    param([switch]$DevMode)
    
    Write-Host "🔙 Starting backend..." -ForegroundColor Blue
    Set-Location "$PSScriptRoot\backend"
    
    if ($DevMode) {
        Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -RedirectStandardOutput "../logs/backend.log" -NoNewWindow
    } else {
        Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload" -RedirectStandardOutput "../logs/backend.log" -NoNewWindow
    }
    Start-Sleep -Seconds 2
}

function Start-Frontend {
    param([switch]$DevMode)
    
    Write-Host "🎨 Starting frontend..." -ForegroundColor Magenta
    Set-Location "$PSScriptRoot\personal-ui-vite"
    
    if ($DevMode) {
        Start-Process -FilePath "npm" -ArgumentList "run dev" -RedirectStandardOutput "../logs/frontend.log" -NoNewWindow
    } else {
        Start-Process -FilePath "npm" -ArgumentList "run dev" -RedirectStandardOutput "../logs/frontend.log" -NoNewWindow
    }
    Start-Sleep -Seconds 3
}

function Stop-Services {
    Write-Host "🛑 Stopping SweatBot services..." -ForegroundColor Red
    
    # Stop backend
    Get-Process | Where-Object { $_.ProcessName -like "*uvicorn*" } | Stop-Process -Force
    Get-Process | Where-Object { $_.ProcessName -like "*vite*" } | Stop-Process -Force
    
    # Stop databases
    Set-Location $PSScriptRoot
    docker-compose -f config/docker/docker-compose.yml down
    
    Write-Host "✅ All services stopped" -ForegroundColor Green
}

function Get-ServiceStatus {
    Write-Host ""
    Write-Host "📊 Service Status Report:" -ForegroundColor Cyan
    Write-Host "──────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
    
    # Check backend
    $backendProcess = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
    if ($backendProcess) {
        Write-Host "✅ Backend: RUNNING (http://localhost:8000)" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend: STOPPED" -ForegroundColor Red
    }
    
    # Check frontend
    $frontendProcess = Get-NetTCPConnection -LocalPort 8005 -ErrorAction SilentlyContinue
    if ($frontendProcess) {
        Write-Host "✅ Frontend: RUNNING (http://localhost:8005)" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend: STOPPED" -ForegroundColor Red
    }
    
    # Check databases
    Set-Location $PSScriptRoot
    $dbStatus = docker-compose -f config/docker/docker-compose.yml ps postgres mongodb redis 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Databases: RUNNING" -ForegroundColor Green
    } else {
        Write-Host "❌ Databases: STOPPED" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "──────────────────────────────────" -ForegroundColor Gray
    Write-Host ""
}

# Main execution logic
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

switch ($Command) {
    "start" {
        Write-Host "🚀 Starting SweatBot ecosystem..." -ForegroundColor Green
        Start-Databases
        Start-Backend
        Start-Frontend
        Start-Sleep -Seconds 2
        Get-ServiceStatus
    }
    "stop" {
        Stop-Services
    }
    "dev" {
        Write-Host "🔧 Starting SweatBot in development mode..." -ForegroundColor Yellow
        Start-Databases
        Start-Backend -DevMode
        Start-Frontend -DevMode
    }
    "status" {
        Get-ServiceStatus
    }
    "backend" {
        Write-Host "🔙 Starting backend service..." -ForegroundColor Blue
        Start-Databases
        Start-Backend
    }
    "frontend" {
        Write-Host "🎨 Starting frontend service..." -ForegroundColor Magenta
        Start-Frontend
    }
    "db" {
        Write-Host "🗄️ Starting database services..." -ForegroundColor Gray
        Start-Databases
    }
    "help" {
        Write-Help
    }
    default {
        Write-Help
    }
}

Write-Host ""
Write-Host "✨ SweatBot operation completed!" -ForegroundColor Green
Write-Host ""