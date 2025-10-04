#!/bin/bash

# SweatBot Unified Launch Script
# Interactive mode selection with comprehensive error handling and debugging
# Combines features from minimal, standard, and full launch modes

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Global Configuration
SCRIPT_VERSION="1.0.0"
LOG_FILE="sweatbot-launch.log"

# Color definitions
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Logging functions
log_with_time() {
    local message="[$(date '+%H:%M:%S')] $1"
    echo -e "$message"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

debug_log() {
    if [ "${DEBUG_MODE:-false}" = true ]; then
        local message="[DEBUG] $(date '+%H:%M:%S') $1"
        echo -e "${CYAN}$message${NC}"
        echo "$message" >> "$LOG_FILE" 2>/dev/null || true
    fi
}

error_log() {
    local message="[ERROR] $(date '+%H:%M:%S') $1"
    echo -e "${RED}$message${NC}" >&2
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

success_log() {
    local message="[SUCCESS] $(date '+%H:%M:%S') $1"
    echo -e "${GREEN}$message${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

warning_log() {
    local message="[WARN] $(date '+%H:%M:%S') $1"
    echo -e "${YELLOW}$message${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

info_log() {
    local message="[INFO] $(date '+%H:%M:%S') $1"
    echo -e "${BLUE}$message${NC}"
    echo "$message" >> "$LOG_FILE" 2>/dev/null || true
}

# Initialize logging
init_logging() {
    # Create log file with timestamp
    echo "=== SweatBot Launch Log - $(date) ===" > "$LOG_FILE"
    echo "Script Version: $SCRIPT_VERSION" >> "$LOG_FILE"
    echo "Working Directory: $(pwd)" >> "$LOG_FILE"
    echo "User: $(whoami)" >> "$LOG_FILE"
    echo "============================================" >> "$LOG_FILE"
}

# Display header
show_header() {
    clear
    echo -e "${PURPLE}"
    echo "==============================================="
    echo "        SweatBot Unified Launch System"
    echo "        Version $SCRIPT_VERSION"
    echo "==============================================="
    echo -e "${NC}"
    echo ""
    
    # Show current directory and basic info
    info_log "Working directory: $(pwd)"
    info_log "Launch mode: ${LAUNCH_MODE:-interactive}"
    echo ""
}

# Parse command line arguments
parse_arguments() {
    LAUNCH_MODE="interactive"
    DEBUG_MODE=false
    FORCE_REINSTALL=false
    SKIP_DATABASES=false
    FRONTEND_ONLY=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --mode=*)
                LAUNCH_MODE="${1#*=}"
                shift
                ;;
            --debug)
                DEBUG_MODE=true
                shift
                ;;
            --force-reinstall)
                FORCE_REINSTALL=true
                shift
                ;;
            --skip-databases)
                SKIP_DATABASES=true
                shift
                ;;
            --frontend-only)
                FRONTEND_ONLY=true
                LAUNCH_MODE="frontend-only"
                shift
                ;;
            --help|-h)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    debug_log "Parsed arguments: MODE=$LAUNCH_MODE, DEBUG=$DEBUG_MODE, FORCE_REINSTALL=$FORCE_REINSTALL"
}

# Show help information
show_help() {
    echo -e "${CYAN}SweatBot Unified Launch Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --mode=MODE          Launch mode: minimal, standard, full, interactive (default: interactive)"
    echo "  --debug              Enable debug output"
    echo "  --force-reinstall    Force reinstallation of dependencies"
    echo "  --skip-databases     Skip database setup (use existing)"
    echo "  --frontend-only      Start only frontend (assumes backend is running)"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Launch Modes:"
    echo "  minimal     - Core AI chat only (fastest startup)"
    echo "  standard    - Full features with smart dependency detection"
    echo "  full        - All features including voice/audio processing"
    echo "  interactive - Show menu to select mode (default)"
    echo ""
    echo "Examples:"
    echo "  $0                           # Interactive mode selection"
    echo "  $0 --mode=minimal           # Quick minimal startup"
    echo "  $0 --mode=full --debug      # Full mode with debug output"
    echo "  $0 --frontend-only          # Start only frontend"
    echo ""
}

# Interactive mode selection
select_launch_mode() {
    if [ "$LAUNCH_MODE" != "interactive" ]; then
        return  # Mode already set via command line
    fi
    
    echo -e "${YELLOW}Select Launch Mode:${NC}"
    echo ""
    echo "1. ${GREEN}Minimal${NC}    - Core AI chat only (fastest, ~2min startup)"
    echo "   ✓ AI Chat Agent  ✓ Database  ✗ Voice  ✗ Audio"
    echo ""
    echo "2. ${BLUE}Standard${NC}   - Full features with smart dependencies (~5min startup)"
    echo "   ✓ AI Chat Agent  ✓ Database  ✓ Voice  ✓ Basic Audio"
    echo ""
    echo "3. ${PURPLE}Full${NC}       - All features including heavy ML models (~10min startup)"
    echo "   ✓ AI Chat Agent  ✓ Database  ✓ Voice  ✓ Full Audio  ✓ PyTorch"
    echo ""
    echo "4. ${CYAN}Frontend Only${NC} - Start frontend assuming backend is running"
    echo "   ✓ Frontend UI (requires existing backend)"
    echo ""
    echo -n "Enter choice [1-4]: "
    read -r choice
    
    case $choice in
        1)
            LAUNCH_MODE="minimal"
            ;;
        2)
            LAUNCH_MODE="standard"
            ;;
        3)
            LAUNCH_MODE="full"
            ;;
        4)
            LAUNCH_MODE="frontend-only"
            FRONTEND_ONLY=true
            ;;
        *)
            warning_log "Invalid choice, defaulting to standard mode"
            LAUNCH_MODE="standard"
            ;;
    esac
    
    info_log "Selected launch mode: $LAUNCH_MODE"
    echo ""
}

# Environment validation
validate_environment() {
    log_with_time "Validating environment..."
    
    # Check if we're in the correct directory
    if [ ! -f "CLAUDE.md" ] || [ ! -d "backend" ]; then
        error_log "Please run this script from the sweatbot directory"
        error_log "Current directory: $(pwd)"
        error_log "Required files: CLAUDE.md, backend/ directory"
        exit 1
    fi
    
    # Check system requirements
    local requirements_ok=true
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        error_log "Python3 not found"
        requirements_ok=false
    else
        debug_log "Python3 found: $(python3 --version)"
    fi
    
    # Check Docker (unless skipping databases)
    if [ "$SKIP_DATABASES" != true ] && [ "$FRONTEND_ONLY" != true ]; then
        if ! command -v docker &> /dev/null; then
            error_log "Docker not found"
            requirements_ok=false
        elif ! docker info > /dev/null 2>&1; then
            error_log "Docker not running. Please start Docker first."
            requirements_ok=false
        else
            debug_log "Docker found and running: $(docker --version)"
        fi
    fi
    
    # Check for package managers (for frontend)
    local package_manager=""
    if command -v bun &> /dev/null; then
        package_manager="bun"
        debug_log "Package manager: Bun $(bun --version)"
    elif command -v npm &> /dev/null; then
        package_manager="npm"
        debug_log "Package manager: npm $(npm --version)"
    else
        warning_log "No frontend package manager found (bun/npm)"
        if [ "$FRONTEND_ONLY" = true ]; then
            error_log "Frontend-only mode requires bun or npm"
            requirements_ok=false
        fi
    fi
    
    # Check available ports
    check_port_availability
    
    if [ "$requirements_ok" != true ]; then
        error_log "Environment validation failed. Please fix the issues above."
        exit 1
    fi
    
    success_log "Environment validation passed"
    export PACKAGE_MANAGER="$package_manager"
}

# Port availability check
check_port_availability() {
    debug_log "Checking port availability in range 8000-8010..."
    
    local available_ports=()
    for port in {8000..8010}; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            available_ports+=($port)
        else
            debug_log "Port $port is in use"
        fi
    done
    
    if [ ${#available_ports[@]} -lt 3 ]; then
        warning_log "Limited ports available: ${available_ports[*]}"
        warning_log "Consider stopping other services or the script will clean up running SweatBot services"
    else
        debug_log "Available ports: ${available_ports[*]}"
    fi
}

# Enhanced port finding with conflict resolution
find_available_port() {
    local start_port=$1
    local end_port=$2
    local service_name=${3:-"service"}
    
    debug_log "Finding available port for $service_name in range $start_port-$end_port"
    
    for port in $(seq $start_port $end_port); do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            debug_log "Found available port $port for $service_name"
            echo $port
            return 0
        fi
    done
    
    # No port found, try to clean up SweatBot services
    warning_log "No available ports found for $service_name in range $start_port-$end_port"
    warning_log "Attempting to clean up existing SweatBot services..."
    
    cleanup_existing_services
    
    # Try again after cleanup
    for port in $(seq $start_port $end_port); do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            debug_log "Found available port $port for $service_name after cleanup"
            echo $port
            return 0
        fi
    done
    
    error_log "Could not find available port for $service_name after cleanup"
    echo $start_port  # fallback
}

# Progress indication functions
show_progress_bar() {
    local current=$1
    local total=$2
    local width=50
    local percentage=$((current * 100 / total))
    local completed=$((current * width / total))
    local remaining=$((width - completed))
    
    printf "\r["
    printf "%*s" "$completed" | tr ' ' '='
    printf "%*s" "$remaining" | tr ' ' '-'
    printf "] %d%%" "$percentage"
    if [ $current -eq $total ]; then
        echo ""
    fi
}

show_step_header() {
    local step=$1
    local total=$2
    local title=$3
    local estimate=${4:-""}
    
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} ${PURPLE}Step $step/$total: $title${NC}"
    if [ -n "$estimate" ]; then
        echo -e "${BLUE}║${NC} ${YELLOW}Estimated time: $estimate${NC}"
    fi
    echo -e "${BLUE}║${NC} ${CYAN}Press Ctrl+C anytime to safely stop${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Interactive confirmation for long operations
confirm_long_operation() {
    local mode=$1
    local total_time=$2
    local features=$3
    
    echo ""
    echo -e "${YELLOW}⚡ About to start SweatBot in ${PURPLE}$mode${NC}${YELLOW} mode${NC}"
    echo ""
    echo -e "${CYAN}📋 What will be installed:${NC}"
    echo "$features"
    echo ""
    echo -e "${YELLOW}⏱️  Estimated total time: ${PURPLE}$total_time${NC}"
    echo -e "${YELLOW}💾 Disk space needed: ${PURPLE}$(get_disk_space_needed "$mode")${NC}"
    echo -e "${YELLOW}🧠 RAM usage during install: ${PURPLE}$(get_ram_usage "$mode")${NC}"
    echo ""
    
    if [ "$total_time" != "~2 minutes" ]; then
        echo -e "${CYAN}💡 Tip: Use ${GREEN}--mode=minimal${NC} for faster startup if you just want to test${NC}"
        echo ""
    fi
    
    echo -n -e "${YELLOW}Continue with $mode mode? [Y/n]: ${NC}"
    read -r response
    
    case "$response" in
        [nN]|[nN][oO])
            info_log "Operation cancelled by user"
            echo ""
            info_log "💡 Quick alternatives:"
            info_log "  ./start-sweatbot.sh --mode=minimal    # Fastest startup (~2min)"
            info_log "  ./start-sweatbot.sh --frontend-only   # UI only (~1min)"
            echo ""
            exit 0
            ;;
        *)
            success_log "✅ Starting $mode mode installation..."
            ;;
    esac
    echo ""
}

# Get disk space requirements by mode
get_disk_space_needed() {
    case "$1" in
        "minimal") echo "~1GB" ;;
        "standard") echo "~3GB" ;;
        "full") echo "~8GB" ;;
        *) echo "~2GB" ;;
    esac
}

# Get RAM usage by mode
get_ram_usage() {
    case "$1" in
        "minimal") echo "~2GB" ;;
        "standard") echo "~4GB" ;;
        "full") echo "~8GB" ;;
        *) echo "~3GB" ;;
    esac
}

# Get feature list by mode
get_features_list() {
    case "$1" in
        "minimal")
            echo "   ✅ FastAPI Backend + Database connectivity"
            echo "   ✅ AI Chat Agent (Hebrew/English)"
            echo "   ✅ Exercise logging and statistics"
            echo "   ✅ PostgreSQL database"
            echo "   ❌ Voice processing (disabled)"
            echo "   ❌ MongoDB conversations (disabled)"
            ;;
        "standard")
            echo "   ✅ All minimal features"
            echo "   ✅ MongoDB conversation memory"
            echo "   ✅ Redis session caching"
            echo "   ✅ Voice processing support"
            echo "   ✅ Basic audio processing"
            echo "   ❌ Heavy ML models (disabled)"
            ;;
        "full")
            echo "   ✅ All standard features"
            echo "   ✅ PyTorch ML framework"
            echo "   ✅ Whisper voice recognition"
            echo "   ✅ Advanced audio processing"
            echo "   ✅ Complete Transformers library"
            echo "   ✅ Full voice/audio capabilities"
            ;;
        *)
            echo "   ✅ Frontend UI only"
            ;;
    esac
}

# Get estimated time by mode
get_estimated_time() {
    case "$1" in
        "minimal") echo "~2 minutes" ;;
        "standard") echo "~5 minutes" ;;
        "full") echo "~10 minutes" ;;
        "frontend-only") echo "~1 minute" ;;
        *) echo "~3 minutes" ;;
    esac
}

# Get dependency installation time by mode
get_dependency_time() {
    case "$1" in
        "minimal") echo "~1 minute" ;;
        "standard") echo "~3 minutes" ;;
        "full") echo "~8 minutes" ;;
        *) echo "~2 minutes" ;;
    esac
}

# Enhanced cleanup with detailed messaging
cleanup_existing_services() {
    echo ""
    info_log "🧹 Ensuring clean startup environment..."
    echo ""
    info_log "Why cleanup is needed:"
    info_log "  • Prevents port conflicts (SweatBot uses ports 8000-8005)"
    info_log "  • Ensures fresh service startup"  
    info_log "  • Clears any stuck processes from previous runs"
    echo ""
    
    # Check what needs to be cleaned
    local processes_found=false
    local ports_in_use=()
    
    # Check for SweatBot processes
    if pgrep -f "uvicorn.*app.main:app" > /dev/null 2>&1; then
        info_log "🔍 Found existing SweatBot backend processes"
        processes_found=true
    fi
    if pgrep -f "agent_service" > /dev/null 2>&1; then
        info_log "🔍 Found existing SweatBot agent processes" 
        processes_found=true
    fi
    if pgrep -f "personal_sweatbot" > /dev/null 2>&1; then
        info_log "🔍 Found existing SweatBot personal processes"
        processes_found=true
    fi
    
    # Check for port conflicts
    for port in {8000..8010}; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            ports_in_use+=($port)
        fi
    done
    
    if [ ${#ports_in_use[@]} -gt 0 ]; then
        info_log "🔍 Ports in use: ${ports_in_use[*]}"
        processes_found=true
    fi
    
    if [ "$processes_found" = false ]; then
        success_log "✅ No cleanup needed - environment is already clean"
        return 0
    fi
    
    log_with_time "🛑 Stopping existing SweatBot services..."
    
    # Kill known SweatBot processes with progress indication
    local cleanup_steps=4
    local current_step=0
    
    # Step 1: Kill backend processes
    ((current_step++))
    info_log "[$current_step/$cleanup_steps] Stopping backend API processes..."
    pkill -f "uvicorn.*app.main:app" 2>/dev/null || true
    sleep 1
    
    # Step 2: Kill agent processes  
    ((current_step++))
    info_log "[$current_step/$cleanup_steps] Stopping AI agent services..."
    pkill -f "agent_service" 2>/dev/null || true
    pkill -f "personal_sweatbot" 2>/dev/null || true
    sleep 1
    
    # Step 3: Clean up ports
    ((current_step++))
    info_log "[$current_step/$cleanup_steps] Freeing up ports 8000-8010..."
    local ports_cleaned=0
    for port in {8000..8010}; do
        if lsof -ti:$port >/dev/null 2>&1; then
            debug_log "  Cleaning port $port"
            lsof -ti:$port | xargs kill -9 2>/dev/null || true
            ((ports_cleaned++))
            sleep 0.2
        fi
    done
    if [ $ports_cleaned -gt 0 ]; then
        debug_log "  Freed $ports_cleaned ports"
    fi
    
    # Step 4: Clean temporary files
    ((current_step++))
    info_log "[$current_step/$cleanup_steps] Removing temporary files..."
    rm -f agent_service_*.py minimal_agent_service.py 2>/dev/null || true
    
    sleep 1
    success_log "✅ Cleanup complete - ready for fresh startup"
}

# Database setup with mode-specific configuration
setup_databases() {
    if [ "$SKIP_DATABASES" = true ] || [ "$FRONTEND_ONLY" = true ]; then
        info_log "Skipping database setup as requested"
        return 0
    fi
    
    log_with_time "Setting up databases for $LAUNCH_MODE mode..."
    
    # Create Docker volumes for persistence
    docker volume create sweatbot_postgres_data 2>/dev/null || true
    docker volume create sweatbot_mongodb_data 2>/dev/null || true
    docker volume create sweatbot_redis_data 2>/dev/null || true
    
    # Setup PostgreSQL (always needed)
    setup_postgresql
    
    # Setup MongoDB (for conversation history)
    if [ "$LAUNCH_MODE" != "minimal" ]; then
        setup_mongodb
    else
        info_log "Skipping MongoDB in minimal mode"
    fi
    
    # Setup Redis (for caching and sessions)
    setup_redis
    
    success_log "Database setup completed"
}

# PostgreSQL setup
setup_postgresql() {
    if docker ps --filter "name=sweatbot_postgres" --format "{{.Names}}" | grep -q "sweatbot_postgres"; then
        success_log "PostgreSQL already running"
        return 0
    fi
    
    log_with_time "Starting PostgreSQL..."
    
    # Stop and remove existing container
    docker stop sweatbot_postgres 2>/dev/null || true
    docker rm sweatbot_postgres 2>/dev/null || true
    
    # Start new container
    if docker run -d --name sweatbot_postgres \
        -p 5434:5432 \
        -e POSTGRES_DB=hebrew_fitness \
        -e POSTGRES_USER=fitness_user \
        -e POSTGRES_PASSWORD=secure_password \
        -e POSTGRES_HOST_AUTH_METHOD=trust \
        -v sweatbot_postgres_data:/var/lib/postgresql/data \
        --restart unless-stopped \
        postgres:15-alpine > /dev/null 2>&1; then
        
        # Wait for PostgreSQL to be ready
        for i in {1..30}; do
            if pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
                success_log "PostgreSQL ready on port 5434"
                return 0
            fi
            sleep 1
            if [ $i -eq 15 ]; then
                info_log "PostgreSQL still starting... (${i}/30)"
            fi
        done
        
        error_log "PostgreSQL failed to start within 30 seconds"
        docker logs sweatbot_postgres 2>/dev/null || true
        return 1
    else
        error_log "Failed to start PostgreSQL container"
        return 1
    fi
}

# MongoDB setup
setup_mongodb() {
    if docker ps --filter "name=sweatbot_mongodb" --format "{{.Names}}" | grep -q "sweatbot_mongodb"; then
        success_log "MongoDB already running"
        return 0
    fi
    
    log_with_time "Starting MongoDB..."
    
    # Stop and remove existing container
    docker stop sweatbot_mongodb 2>/dev/null || true
    docker rm sweatbot_mongodb 2>/dev/null || true
    
    # Start new container
    if docker run -d --name sweatbot_mongodb \
        -p 27017:27017 \
        -e MONGO_INITDB_ROOT_USERNAME=sweatbot \
        -e MONGO_INITDB_ROOT_PASSWORD=secure_password \
        -v sweatbot_mongodb_data:/data/db \
        --restart unless-stopped \
        mongo:latest > /dev/null 2>&1; then
        
        success_log "MongoDB ready on port 27017"
        return 0
    else
        error_log "Failed to start MongoDB container"
        return 1
    fi
}

# Redis setup
setup_redis() {
    local redis_port=$(find_available_port 6379 6389 "Redis")
    
    if docker ps --filter "name=sweatbot_redis" --format "{{.Names}}" | grep -q "sweatbot_redis"; then
        success_log "Redis already running"
        return 0
    fi
    
    log_with_time "Starting Redis on port $redis_port..."
    
    # Stop and remove existing container
    docker stop sweatbot_redis 2>/dev/null || true
    docker rm sweatbot_redis 2>/dev/null || true
    
    # Start new container
    if docker run -d --name sweatbot_redis \
        -p ${redis_port}:6379 \
        -v sweatbot_redis_data:/data \
        --restart unless-stopped \
        redis:7-alpine redis-server --appendonly yes --requirepass sweatbot_redis_pass > /dev/null 2>&1; then
        
        success_log "Redis ready on port $redis_port"
        export REDIS_PORT="$redis_port"
        return 0
    else
        error_log "Failed to start Redis container"
        return 1
    fi
}

# Smart dependency installation based on launch mode
install_dependencies() {
    if [ "$FRONTEND_ONLY" = true ]; then
        info_log "Skipping backend dependencies in frontend-only mode"
        return 0
    fi
    
    log_with_time "Installing dependencies for $LAUNCH_MODE mode..."
    
    cd backend
    
    # Setup virtual environment
    setup_python_environment
    
    # Install packages based on mode
    case $LAUNCH_MODE in
        "minimal")
            install_minimal_packages
            ;;
        "standard")
            install_standard_packages
            ;;
        "full")
            install_full_packages
            ;;
    esac
    
    # Verify critical imports
    verify_package_installation
    
    cd ..
    success_log "Dependencies installed successfully"
}

# Setup Python virtual environment
setup_python_environment() {
    log_with_time "Setting up Python virtual environment..."
    
    if [ ! -d "venv" ] || [ "$FORCE_REINSTALL" = true ]; then
        if [ -d "venv" ]; then
            warning_log "Removing existing virtual environment due to --force-reinstall"
            rm -rf venv
        fi
        info_log "Creating new virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        debug_log "Activated Linux virtual environment"
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
        debug_log "Activated Windows virtual environment"
    else
        error_log "Could not find virtual environment activation script"
        exit 1
    fi
    
    # Upgrade pip
    debug_log "Upgrading pip..."
    pip install --upgrade pip > /dev/null 2>&1
}

# Install minimal packages (AI chat + database only)
install_minimal_packages() {
    info_log "Installing minimal packages (AI chat + database)..."
    
    cat > /tmp/minimal_packages.txt << EOF
wheel
setuptools
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
psycopg2-binary==2.9.9
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt
PyJWT
cryptography
python-dotenv==1.0.0
pydantic[email]==2.5.2
pydantic-settings==2.1.0
email-validator==2.1.0
phidata
openai
groq
google-generativeai
numpy==1.24.3
pymongo==4.6.1
motor==3.3.2
redis==5.0.1
EOF
    
    pip install -r /tmp/minimal_packages.txt > /dev/null 2>&1
    rm -f /tmp/minimal_packages.txt
}

# Install standard packages (includes MongoDB and basic audio)
install_standard_packages() {
    info_log "Installing standard packages (full features - smart detection)..."
    
    # First install minimal packages
    install_minimal_packages
    
    # Add standard packages
    cat > /tmp/standard_packages.txt << EOF
pymongo==4.6.1
motor==3.3.2
redis==5.0.1
aioredis==2.0.1
httpx==0.25.2
aiohttp==3.9.1
websockets==12.0
numpy==1.24.3
scipy==1.11.4
soundfile==0.12.1
pydub==0.25.1
EOF
    
    pip install -r /tmp/standard_packages.txt > /dev/null 2>&1
    rm -f /tmp/standard_packages.txt
}

# Install full packages (includes PyTorch and ML models)
install_full_packages() {
    info_log "Installing full packages (including ML models - this may take 10+ minutes)..."
    
    # First install standard packages
    install_standard_packages
    
    # Add heavy ML packages
    cat > /tmp/full_packages.txt << EOF
torch==2.1.1
torchaudio==2.1.1
librosa==0.10.1
transformers
huggingface-hub
anthropic
structlog==23.2.0
prometheus-client==0.19.0
python-slugify==8.0.1
pendulum==2.1.2
pytest==7.4.3
pytest-asyncio==0.21.1
EOF
    
    info_log "Installing PyTorch and ML packages (this will take several minutes)..."
    pip install -r /tmp/full_packages.txt
    rm -f /tmp/full_packages.txt
}

# Verify package installation
verify_package_installation() {
    log_with_time "Verifying package installation..."
    
    local verification_script="
try:
    import fastapi, uvicorn, sqlalchemy
    print('✓ Core backend packages OK')
except ImportError as e:
    print(f'✗ Core backend packages: {e}')
    exit(1)

try:
    import bcrypt, jwt, passlib, cryptography
    print('✓ Authentication packages OK')
except ImportError as e:
    print(f'✗ Authentication packages: {e}')

try:
    import pydantic, email_validator
    print('✓ Validation packages OK')
except ImportError as e:
    print(f'✗ Validation packages: {e}')

try:
    import phidata, openai, groq
    print('✓ AI agent packages OK')
except ImportError as e:
    print(f'✗ AI agent packages: {e}')
"
    
    if [ "$LAUNCH_MODE" != "minimal" ]; then
        verification_script+="
try:
    import pymongo, motor
    print('✓ MongoDB packages OK')
except ImportError as e:
    print(f'✗ MongoDB packages: {e}')

try:
    import numpy, scipy
    print('✓ Scientific computing OK')
except ImportError as e:
    print(f'✗ Scientific computing: {e}')
"
    fi
    
    if [ "$LAUNCH_MODE" = "full" ]; then
        verification_script+="
try:
    import torch, torchaudio, librosa
    print('✓ ML packages OK')
except ImportError as e:
    print(f'✗ ML packages: {e}')
"
    fi
    
    python3 -c "$verification_script"
}

# Start backend API
start_backend() {
    if [ "$FRONTEND_ONLY" = true ]; then
        info_log "Skipping backend startup in frontend-only mode"
        return 0
    fi
    
    local backend_port=$(find_available_port 8000 8005 "Backend")
    log_with_time "Starting Backend API on port $backend_port..."
    
    cd backend
    
    # Ensure virtual environment is activated
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    fi
    
    # Start backend
    nohup python -m uvicorn app.main:app --host 0.0.0.0 --port $backend_port --reload > ../backend.log 2>&1 &
    local backend_pid=$!
    
    cd ..
    
    # Wait for backend to be ready
    for i in {1..20}; do
        if curl -s http://localhost:$backend_port/health > /dev/null 2>&1; then
            success_log "Backend API ready at http://localhost:$backend_port"
            export BACKEND_PORT="$backend_port"
            export BACKEND_PID="$backend_pid"
            return 0
        fi
        sleep 1
        if [ $i -eq 10 ]; then
            info_log "Backend still starting... (${i}/20)"
        fi
    done
    
    error_log "Backend failed to start within 20 seconds"
    error_log "Backend log output:"
    tail -10 backend.log
    return 1
}

# Start AI agent service
start_agent_service() {
    if [ "$FRONTEND_ONLY" = true ]; then
        info_log "Skipping agent service startup in frontend-only mode"
        return 0
    fi
    
    local agent_port=$(find_available_port 8001 8010 "Agent")
    log_with_time "Starting AI Agent Service on port $agent_port..."
    
    # Create agent service wrapper
    create_agent_service_wrapper "$agent_port"
    
    # Start agent service
    nohup python agent_service_wrapper.py > agent.log 2>&1 &
    local agent_pid=$!
    
    # Wait for agent service to be ready
    for i in {1..25}; do
        if curl -s http://localhost:$agent_port/health > /dev/null 2>&1; then
            success_log "Agent Service ready at http://localhost:$agent_port"
            export AGENT_PORT="$agent_port"
            export AGENT_PID="$agent_pid"
            return 0
        fi
        sleep 1
        if [ $i -eq 15 ]; then
            info_log "Agent service still starting... (${i}/25)"
        fi
    done
    
    error_log "Agent service failed to start within 25 seconds"
    error_log "Agent log output:"
    tail -10 agent.log
    return 1
}

# Create agent service wrapper dynamically
create_agent_service_wrapper() {
    local port=$1
    
    cat > agent_service_wrapper.py << EOF
import sys
import os
sys.path.append('src')

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import datetime

# Import the PersonalSweatBot
from agents.personal_sweatbot_with_tools import PersonalSweatBotWithTools

app = FastAPI(
    title="SweatBot Agent Service",
    description="AI Agent Service for SweatBot Hebrew Fitness Tracking",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8004",
        "http://localhost:8005", 
        "http://localhost:3000",
        "http://localhost:4000",
        "http://localhost:4445"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global bot instance
bot = None

@app.on_event("startup")
async def startup():
    global bot
    try:
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [INIT] Initializing PersonalSweatBot...")
        bot = PersonalSweatBotWithTools()
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [SUCCESS] PersonalSweatBot ready for mode: $LAUNCH_MODE")
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [INFO] Agent service listening on port $port")
    except Exception as e:
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [ERROR] Bot initialization failed: {e}")
        raise e

class ChatRequest(BaseModel):
    message: str
    user_id: str = "personal"

class ChatResponse(BaseModel):
    response: str
    session_id: str
    agent_used: str
    timestamp: str
    mode: str

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if not bot:
        raise HTTPException(status_code=500, detail="Bot not initialized")
    
    try:
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [CHAT] Processing: {request.message[:50]}...")
        response_text = bot.chat(request.message)
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [CHAT] Response ready (mode: $LAUNCH_MODE)")
        
        return ChatResponse(
            response=response_text,
            session_id="auto-generated",
            agent_used="PersonalSweatBotWithTools",
            timestamp=datetime.datetime.now().isoformat(),
            mode="$LAUNCH_MODE"
        )
    except Exception as e:
        print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [ERROR] Chat processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "SweatBot Agent Service",
        "mode": "$LAUNCH_MODE",
        "port": $port,
        "bot_initialized": bot is not None,
        "timestamp": datetime.datetime.now().isoformat(),
        "features": {
            "ai_chat": True,
            "database": True,
            "mongodb_memory": "$LAUNCH_MODE" != "minimal",
            "voice_processing": "$LAUNCH_MODE" in ["standard", "full"],
            "ml_models": "$LAUNCH_MODE" == "full"
        }
    }

@app.get("/status")
async def status():
    return {
        "service": "SweatBot Agent",
        "mode": "$LAUNCH_MODE",
        "bot_ready": bot is not None,
        "uptime": "running"
    }

if __name__ == "__main__":
    print(f"[{datetime.datetime.now().strftime('%H:%M:%S')}] [START] Starting SweatBot Agent Service in $LAUNCH_MODE mode")
    uvicorn.run("agent_service_wrapper:app", host="0.0.0.0", port=$port, reload=False)
EOF
}

# Start frontend
start_frontend() {
    local frontend_port=$(find_available_port 8004 8010 "Frontend")
    log_with_time "Starting Frontend UI on port $frontend_port..."
    
    if [ ! -d "personal-ui-vite" ]; then
        error_log "Frontend directory 'personal-ui-vite' not found"
        return 1
    fi
    
    cd personal-ui-vite
    
    # Update frontend configuration to use correct agent port
    if [ -f "src/components/SweatBotChat.tsx" ] && [ -n "${AGENT_PORT:-}" ]; then
        debug_log "Updating frontend to use agent port $AGENT_PORT"
        sed -i.bak "s|http://localhost:8001/chat|http://localhost:$AGENT_PORT/chat|g" src/components/SweatBotChat.tsx 2>/dev/null || true
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ] || [ "$FORCE_REINSTALL" = true ]; then
        log_with_time "Installing frontend dependencies..."
        
        if [ "$PACKAGE_MANAGER" = "bun" ]; then
            bun install > /dev/null 2>&1
        elif [ "$PACKAGE_MANAGER" = "npm" ]; then
            npm install --silent > /dev/null 2>&1
        else
            error_log "No package manager available for frontend"
            cd ..
            return 1
        fi
    fi
    
    # Start frontend server
    info_log "Using package manager: $PACKAGE_MANAGER"
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        nohup bun run dev --port $frontend_port > ../frontend.log 2>&1 &
    else
        PORT=$frontend_port nohup npm run dev > ../frontend.log 2>&1 &
    fi
    
    local frontend_pid=$!
    cd ..
    
    # Wait for frontend to be ready
    for i in {1..30}; do
        if curl -s http://localhost:$frontend_port > /dev/null 2>&1; then
            success_log "Frontend UI ready at http://localhost:$frontend_port"
            export FRONTEND_PORT="$frontend_port"
            export FRONTEND_PID="$frontend_pid"
            return 0
        fi
        sleep 1
        if [ $i -eq 20 ]; then
            info_log "Frontend still starting... (${i}/30)"
        fi
    done
    
    warning_log "Frontend may still be loading..."
    export FRONTEND_PORT="$frontend_port"
    export FRONTEND_PID="$frontend_pid"
    return 0
}

# Comprehensive health check
perform_health_check() {
    log_with_time "Performing comprehensive health check..."
    echo ""
    
    local all_healthy=true
    
    # Check PostgreSQL
    if pg_isready -h localhost -p 5434 -U fitness_user > /dev/null 2>&1; then
        success_log "PostgreSQL: Running (port 5434) - Exercise data preserved"
    else
        error_log "PostgreSQL: Not responding"
        all_healthy=false
    fi
    
    # Check MongoDB (if not minimal mode)
    if [ "$LAUNCH_MODE" != "minimal" ]; then
        if nc -z localhost 27017 2>/dev/null; then
            success_log "MongoDB: Running (port 27017) - Conversations preserved"
        else
            warning_log "MongoDB: Not responding"
        fi
    else
        info_log "MongoDB: Skipped in minimal mode"
    fi
    
    # Check Redis
    if [ -n "${REDIS_PORT:-}" ] && nc -z localhost "$REDIS_PORT" 2>/dev/null; then
        success_log "Redis: Running (port $REDIS_PORT) - Session cache active"
    else
        warning_log "Redis: Not responding"
    fi
    
    # Check Backend API
    if [ "$FRONTEND_ONLY" != true ] && [ -n "${BACKEND_PORT:-}" ]; then
        if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
            success_log "Backend API: Running (port $BACKEND_PORT)"
        else
            error_log "Backend API: Not responding"
            all_healthy=false
        fi
    fi
    
    # Check Agent Service
    if [ "$FRONTEND_ONLY" != true ] && [ -n "${AGENT_PORT:-}" ]; then
        if curl -s http://localhost:$AGENT_PORT/health > /dev/null 2>&1; then
            success_log "Agent Service: Running (port $AGENT_PORT)"
        else
            error_log "Agent Service: Not responding"
            all_healthy=false
        fi
    fi
    
    # Check Frontend
    if [ -n "${FRONTEND_PORT:-}" ]; then
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
            success_log "Frontend UI: Running (port $FRONTEND_PORT)"
        else
            warning_log "Frontend UI: May still be loading"
        fi
    fi
    
    echo ""
    if [ "$all_healthy" = true ]; then
        success_log "All critical services are healthy!"
    else
        warning_log "Some services need attention - check logs for details"
    fi
}

# Display startup summary
show_startup_summary() {
    echo ""
    echo -e "${PURPLE}===============================================${NC}"
    echo -e "${PURPLE}    SweatBot System Ready - $LAUNCH_MODE Mode!${NC}"
    echo -e "${PURPLE}===============================================${NC}"
    echo ""
    
    # Show access information
    if [ -n "${FRONTEND_PORT:-}" ]; then
        echo -e "${GREEN}🌐 Access SweatBot:${NC}"
        echo -e "   ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
        echo ""
    fi
    
    # Show API endpoints
    if [ "$FRONTEND_ONLY" != true ]; then
        echo -e "${BLUE}🔗 API Endpoints:${NC}"
        [ -n "${BACKEND_PORT:-}" ] && echo "   Backend API:  http://localhost:$BACKEND_PORT"
        [ -n "${AGENT_PORT:-}" ] && echo "   Agent Service: http://localhost:$AGENT_PORT"
        echo ""
    fi
    
    # Show test commands
    echo -e "${YELLOW}🧪 Quick Tests:${NC}"
    if [ -n "${FRONTEND_PORT:-}" ]; then
        echo "   Browser: Open http://localhost:$FRONTEND_PORT"
        echo "   Try asking: \"How many points do I have?\""
    fi
    if [ -n "${AGENT_PORT:-}" ]; then
        echo "   API Test:"
        echo "   curl -X POST http://localhost:$AGENT_PORT/chat \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"message\":\"How many points do I have?\"}'"
    fi
    echo ""
    
    # Show features available
    echo -e "${GREEN}✅ Features Available in $LAUNCH_MODE Mode:${NC}"
    echo "   • AI Chat Agent (Hebrew + English)"
    echo "   • Exercise Database (PostgreSQL)"
    echo "   • Statistics Retrieval"
    echo "   • Exercise Logging"
    
    if [ "$LAUNCH_MODE" != "minimal" ]; then
        echo "   • Conversation Memory (MongoDB)"
        echo "   • Session Caching (Redis)"
        echo "   • Voice Processing Support"
    fi
    
    if [ "$LAUNCH_MODE" = "full" ]; then
        echo "   • ML Model Support (PyTorch)"
        echo "   • Advanced Audio Processing"
    fi
    echo ""
    
    # Show logs
    echo -e "${CYAN}📋 Log Files:${NC}"
    echo "   • Launch: tail -f $LOG_FILE"
    [ "$FRONTEND_ONLY" != true ] && echo "   • Backend: tail -f backend.log"
    [ "$FRONTEND_ONLY" != true ] && echo "   • Agent: tail -f agent.log"
    [ -n "${FRONTEND_PORT:-}" ] && echo "   • Frontend: tail -f frontend.log"
    echo ""
}

# Cleanup function
cleanup() {
    echo ""
    log_with_time "Stopping SweatBot services..."
    
    # Kill service processes
    [ -n "${BACKEND_PID:-}" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "${AGENT_PID:-}" ] && kill $AGENT_PID 2>/dev/null || true
    [ -n "${FRONTEND_PID:-}" ] && kill $FRONTEND_PID 2>/dev/null || true
    
    # Restore frontend configuration
    if [ -f "personal-ui-vite/src/components/SweatBotChat.tsx.bak" ]; then
        mv personal-ui-vite/src/components/SweatBotChat.tsx.bak personal-ui-vite/src/components/SweatBotChat.tsx 2>/dev/null || true
    fi
    
    # Clean up temporary files
    rm -f agent_service_wrapper.py 2>/dev/null || true
    
    success_log "Services stopped (databases preserved for data persistence)"
    success_log "Launch log saved to: $LOG_FILE"
    exit 0
}

# Main execution function
main() {
    # Initialize
    init_logging
    parse_arguments "$@"
    
    # Show header and validate environment
    show_header
    validate_environment
    
    # Interactive mode selection
    select_launch_mode
    
    # Interactive confirmation for long operations (skip for minimal and frontend-only)
    if [ "$LAUNCH_MODE" != "minimal" ] && [ "$LAUNCH_MODE" != "interactive" ] && [ "$LAUNCH_MODE" != "frontend-only" ]; then
        local estimated_time=$(get_estimated_time "$LAUNCH_MODE")
        local features_list=$(get_features_list "$LAUNCH_MODE")
        confirm_long_operation "$LAUNCH_MODE" "$estimated_time" "$features_list"
    fi
    
    echo ""
    log_with_time "Starting SweatBot in $LAUNCH_MODE mode..."
    echo ""
    
    # Execute startup sequence with step indicators
    if [ "$FRONTEND_ONLY" = true ]; then
        # Frontend only mode - single step
        show_step_header 1 1 "Starting Frontend UI" "~1 minute"
        start_frontend
    else
        # Full startup sequence with step indicators
        local total_steps=6
        
        show_step_header 1 $total_steps "Environment Cleanup" "~30 seconds"
        cleanup_existing_services
        
        show_step_header 2 $total_steps "Database Setup" "~1 minute"
        setup_databases
        
        show_step_header 3 $total_steps "Installing Dependencies" "$(get_dependency_time "$LAUNCH_MODE")"
        install_dependencies
        
        show_step_header 4 $total_steps "Starting Backend API" "~1 minute"
        start_backend
        
        show_step_header 5 $total_steps "Starting AI Agent Service" "~2 minutes"
        start_agent_service
        
        show_step_header 6 $total_steps "Starting Frontend UI" "~1 minute"
        start_frontend
    fi
    
    # Final health check and summary
    perform_health_check
    show_startup_summary
    
    # Set up signal handler for cleanup
    trap cleanup INT
    
    log_with_time "Press Ctrl+C to stop all services"
    log_with_time "Databases will remain running for data persistence"
    echo ""
    
    # Keep script running
    wait
}

# Execute main function with all arguments
main "$@"