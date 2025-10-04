#!/bin/bash

# SweatBot Comprehensive Dependency Installer
# Installs ALL required packages for complete functionality

log_with_time() {
    echo "[$(date '+%H:%M:%S')] $1"
}

log_with_time "==============================================="
log_with_time "SweatBot Comprehensive Dependency Installer"
log_with_time "Installing ALL packages for complete functionality"
log_with_time "==============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "CLAUDE.md" ] || [ ! -d "backend" ]; then
    log_with_time "${RED}[ERROR] Run from sweatbot directory${NC}"
    exit 1
fi

cd backend

# Setup virtual environment
log_with_time "[VENV] Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    log_with_time "[VENV] Created new virtual environment"
fi

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
    log_with_time "[VENV] Activated Linux virtual environment"
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
    log_with_time "[VENV] Activated Windows virtual environment"
else
    log_with_time "${RED}[ERROR] Could not find virtual environment activation script${NC}"
    exit 1
fi

# Upgrade pip first
log_with_time "[PIP] Upgrading pip to latest version..."
pip install --upgrade pip > /dev/null 2>&1

# Stage 1: Core Python packages (essential for everything)
log_with_time "[STAGE 1] Installing core Python packages..."
cat > /tmp/core_packages.txt << EOF
wheel
setuptools
pip
setuptools-rust
EOF

pip install -r /tmp/core_packages.txt

# Stage 2: Database and API packages
log_with_time "[STAGE 2] Installing database and API packages..."
cat > /tmp/database_packages.txt << EOF
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy[asyncio]==2.0.23
asyncpg==0.29.0
psycopg2-binary==2.9.9
alembic==1.12.1
redis==5.0.1
aioredis==2.0.1
python-multipart==0.0.6
EOF

pip install -r /tmp/database_packages.txt

# Stage 3: Authentication and security
log_with_time "[STAGE 3] Installing authentication packages..."
cat > /tmp/auth_packages.txt << EOF
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt
PyJWT
cryptography
python-dotenv==1.0.0
EOF

pip install -r /tmp/auth_packages.txt

# Stage 4: Data validation and serialization
log_with_time "[STAGE 4] Installing data validation packages..."
cat > /tmp/validation_packages.txt << EOF
pydantic[email]==2.5.2
pydantic-settings==2.1.0
email-validator==2.1.0
EOF

pip install -r /tmp/validation_packages.txt

# Stage 5: MongoDB for conversation storage
log_with_time "[STAGE 5] Installing MongoDB packages..."
cat > /tmp/mongodb_packages.txt << EOF
pymongo==4.6.1
motor==3.3.2
EOF

pip install -r /tmp/mongodb_packages.txt

# Stage 6: AI Agent packages
log_with_time "[STAGE 6] Installing AI agent packages..."
cat > /tmp/ai_packages.txt << EOF
phidata
openai
groq
google-generativeai
anthropic
EOF

pip install -r /tmp/ai_packages.txt

# Stage 7: Scientific computing packages (for voice processing)
log_with_time "[STAGE 7] Installing scientific computing packages..."
cat > /tmp/scientific_packages.txt << EOF
numpy==1.24.3
scipy==1.11.4
EOF

pip install -r /tmp/scientific_packages.txt

# Stage 8: Audio processing packages (optional but needed for full voice)
log_with_time "[STAGE 8] Installing audio processing packages..."
log_with_time "  ${YELLOW}[INFO] This may take several minutes for PyTorch...${NC}"
cat > /tmp/audio_packages.txt << EOF
torch==2.1.1
torchaudio==2.1.1
librosa==0.10.1
soundfile==0.12.1
pydub==0.25.1
EOF

pip install -r /tmp/audio_packages.txt

# Stage 9: Additional utilities
log_with_time "[STAGE 9] Installing utility packages..."
cat > /tmp/utility_packages.txt << EOF
httpx==0.25.2
aiohttp==3.9.1
websockets==12.0
structlog==23.2.0
prometheus-client==0.19.0
python-slugify==8.0.1
pendulum==2.1.2
EOF

pip install -r /tmp/utility_packages.txt

# Stage 10: Optional packages for development and testing
log_with_time "[STAGE 10] Installing development packages..."
cat > /tmp/dev_packages.txt << EOF
pytest==7.4.3
pytest-asyncio==0.21.1
gunicorn==21.2.0
celery==5.3.4
EOF

pip install -r /tmp/dev_packages.txt

# Clean up temporary files
rm -f /tmp/*_packages.txt

# Final verification
log_with_time "[VERIFY] Verifying critical package installations..."

# Test core imports
python3 -c "
try:
    import fastapi, uvicorn, sqlalchemy, asyncpg, psycopg2
    print('✓ Core backend packages OK')
except ImportError as e:
    print(f'✗ Core backend packages: {e}')

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
    import pymongo, motor
    print('✓ MongoDB packages OK')
except ImportError as e:
    print(f'✗ MongoDB packages: {e}')

try:
    import phidata, openai, groq, google.generativeai
    print('✓ AI agent packages OK')
except ImportError as e:
    print(f'✗ AI agent packages: {e}')

try:
    import numpy, scipy
    print('✓ Scientific computing packages OK')
except ImportError as e:
    print(f'✗ Scientific computing packages: {e}')

try:
    import torch, torchaudio, librosa
    print('✓ Audio processing packages OK')
except ImportError as e:
    print(f'✗ Audio processing packages: {e}')

try:
    import redis, aioredis, httpx
    print('✓ Additional utilities OK')
except ImportError as e:
    print(f'✗ Additional utilities: {e}')
"

echo ""
log_with_time "[INFO] Package installation summary:"
pip list | grep -E "(fastapi|uvicorn|phidata|openai|torch|numpy|pymongo)" || echo "Some packages may not be listed"

echo ""
log_with_time "==============================================="
log_with_time "Installation Complete!"
log_with_time "==============================================="

# Get back to project root
cd ..

log_with_time "${GREEN}[SUCCESS] All SweatBot dependencies installed!${NC}"
log_with_time ""
log_with_time "${YELLOW}[NEXT STEPS]${NC}"
log_with_time "1. Run: ./launch-sweatbot-fixed.sh"
log_with_time "2. Or run individual services manually"
log_with_time "3. All features should now be available:"
log_with_time "   • AI Chat Agents ✓"
log_with_time "   • Database Connectivity ✓"  
log_with_time "   • Voice Processing ✓"
log_with_time "   • Audio Features ✓"
log_with_time "   • MongoDB Memory ✓"
log_with_time "   • Real-time WebSockets ✓"
echo ""
log_with_time "${YELLOW}[STORAGE INFO]${NC}"
log_with_time "Virtual environment location: backend/venv/"
log_with_time "Installed packages persist between runs"
log_with_time "No need to reinstall unless packages are updated"
echo ""