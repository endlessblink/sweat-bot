# Hebrew CrossFit AI - Project Cleanup Plan

## 🎯 Current Project State Analysis

### Files Inventory
```
📁 sweatbot/
├── 🟢 Core Application Files (Keep & Enhance)
│   ├── main_ui_final_gamified.py (Primary desktop app)
│   ├── exercise_tracker.py (Database system)
│   ├── hebrew_voice_recognition.py (Voice processing)
│   ├── hebrew_ai_coach.py (AI responses)
│   ├── hebrew_workout_parser.py (Exercise parsing)
│   ├── hebrew_gamification.py (Points & levels)
│   └── hebrew_tts_service.py (Text-to-speech)
│
├── 🟡 Legacy/Testing Files (Archive or Remove)
│   ├── main_ui_optimized.py (Old version)
│   ├── main_ui_working.py (Old version)
│   ├── main_ui_google.py (Superseded)
│   ├── main_ui_google_enhanced.py (Superseded)
│   ├── main_ui_stable_final.py (Old stable version)
│   ├── main_ui_simple.py (Early test)
│   └── test_*.py files (Keep for testing)
│
├── 🔵 Web Version Files (Enhance)
│   ├── streamlit_app.py (Web prototype)
│   ├── requirements_web.txt (Dependencies)
│   └── view_database.py (Database viewer)
│
├── 🟠 Configuration Files (Review & Secure)
│   ├── .env (Contains API keys - secure)
│   ├── *.bat files (Multiple run scripts - consolidate)
│   └── workout_data.db (User data - backup)
│
└── 🔴 New Files to Create
    ├── README.md (Project documentation)
    ├── setup.py (Installation script)
    ├── requirements.txt (Consolidated dependencies)
    ├── config.py (Configuration management)
    └── tests/ (Proper test structure)
```

## 🧹 Cleanup Actions

### 1. File Organization
```
📁 hebrew-crossfit-ai/
├── 📁 src/
│   ├── 📁 core/
│   │   ├── exercise_tracker.py
│   │   ├── ai_coach.py
│   │   ├── voice_recognition.py
│   │   ├── workout_parser.py
│   │   └── gamification.py
│   │
│   ├── 📁 ui/
│   │   ├── desktop_app.py (renamed from main_ui_final_gamified.py)
│   │   ├── web_app.py (enhanced streamlit)
│   │   └── mobile_app.py (new mobile-optimized)
│   │
│   ├── 📁 services/
│   │   ├── tts_service.py
│   │   ├── speech_service.py
│   │   └── api_service.py
│   │
│   └── 📁 utils/
│       ├── database.py
│       ├── config.py
│       └── helpers.py
│
├── 📁 tests/
│   ├── test_exercise_tracking.py
│   ├── test_voice_recognition.py
│   └── test_ai_coach.py
│
├── 📁 docs/
│   ├── README.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── USER_GUIDE.md
│
├── 📁 scripts/
│   ├── setup.py
│   ├── run_desktop.py
│   ├── run_web.py
│   └── deploy.py
│
├── 📁 data/
│   ├── sample_workouts.json
│   ├── hebrew_exercises.json
│   └── default_config.json
│
├── 📁 assets/
│   ├── icons/
│   ├── sounds/
│   └── images/
│
├── 📁 legacy/ (Archive old versions)
│   └── old_versions/
│
├── requirements.txt
├── setup.py
├── .gitignore
├── .env.example
└── LICENSE
```

### 2. Code Consolidation

#### Unified Configuration System
```python
# src/utils/config.py
import os
from pathlib import Path
from typing import Dict, Any

class Config:
    """Centralized configuration management"""
    
    def __init__(self):
        self.load_env()
        self.validate_config()
    
    def load_env(self):
        """Load environment variables"""
        self.gemini_api_key = os.getenv('GEMINI_API_KEY')
        self.groq_api_key = os.getenv('GROQ_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.elevenlabs_api_key = os.getenv('ELEVENLABS_API_KEY')
        
        # Database
        self.db_path = os.getenv('DB_PATH', 'workout_data.db')
        
        # Voice settings
        self.voice_language = os.getenv('VOICE_LANGUAGE', 'he-IL')
        self.voice_model = os.getenv('VOICE_MODEL', 'whisper')
        
        # UI settings
        self.ui_theme = os.getenv('UI_THEME', 'light')
        self.ui_language = os.getenv('UI_LANGUAGE', 'he')
    
    def validate_config(self):
        """Validate required configuration"""
        required = ['gemini_api_key']
        missing = [key for key in required if not getattr(self, key)]
        if missing:
            raise ValueError(f"Missing required config: {missing}")

# Global config instance
config = Config()
```

#### Unified Exercise Tracking
```python
# src/core/exercise_tracker.py (Enhanced)
from typing import Optional, List, Dict, Any
from datetime import datetime
import sqlite3
from .database import DatabaseManager
from .config import config

class ExerciseTracker:
    """Unified exercise tracking with multi-platform support"""
    
    def __init__(self, db_path: Optional[str] = None):
        self.db = DatabaseManager(db_path or config.db_path)
        self.current_session: Optional[WorkoutSession] = None
    
    def log_exercise(self, exercise_he: str, reps: int, 
                    source: str = "voice", **kwargs) -> ExerciseEntry:
        """Log exercise from any source (voice, manual, import)"""
        
    def get_analytics(self, user_id: Optional[str] = None, 
                     timeframe: str = "week") -> Dict[str, Any]:
        """Get comprehensive analytics"""
        
    def export_data(self, format: str = "json") -> str:
        """Export user data in various formats"""
```

### 3. Dependencies Management

#### Consolidated requirements.txt
```txt
# Core dependencies
python>=3.9
sqlite3  # Built-in

# AI and Speech
openai>=1.0.0
groq>=0.4.0
google-generativeai>=0.3.0
speechrecognition>=3.10.0
pyttsx3>=2.90

# Audio processing
pyaudio>=0.2.11
sounddevice>=0.4.6
soundfile>=0.12.1

# ML/NLP
transformers>=4.30.0
torch>=2.0.0
librosa>=0.10.0

# Web framework
streamlit>=1.28.0
fastapi>=0.104.0
uvicorn>=0.23.0

# Data processing
pandas>=2.0.0
numpy>=1.24.0
plotly>=5.15.0

# Database
sqlalchemy>=2.0.0
alembic>=1.12.0

# Utils
python-dateutil>=2.8.0
requests>=2.31.0
python-dotenv>=1.0.0

# Development
pytest>=7.4.0
black>=23.0.0
flake8>=6.0.0
mypy>=1.5.0
```

#### Setup Script
```python
# setup.py
from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="hebrew-crossfit-ai",
    version="2.0.0",
    author="Hebrew CrossFit AI Team",
    description="AI-powered Hebrew CrossFit coaching with voice interaction",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.9",
    install_requires=requirements,
    entry_points={
        "console_scripts": [
            "hebrew-crossfit-desktop=ui.desktop_app:main",
            "hebrew-crossfit-web=ui.web_app:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.json", "*.yml", "*.yaml"],
    },
)
```

### 4. Documentation Structure

#### README.md
```markdown
# Hebrew CrossFit AI 🏋️

> AI-powered Hebrew CrossFit coaching with advanced voice interaction

## Features
- 🗣️ Full Hebrew voice interaction (speech-to-text & text-to-speech)
- 🤖 Advanced AI coaching with personalized responses
- 📊 Comprehensive exercise tracking and analytics
- 🎮 Gamification with points, levels, and achievements
- 📱 Mobile-responsive web interface
- 🖥️ Desktop application with full features

## Quick Start
```bash
# Install
pip install -e .

# Run desktop app
hebrew-crossfit-desktop

# Run web app
hebrew-crossfit-web
```

## Documentation
- [User Guide](docs/USER_GUIDE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
```

### 5. Security Enhancements

#### Environment Configuration
```bash
# .env.example
# Copy to .env and fill with your API keys

# AI Services
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
OPENAI_API_KEY=your_openai_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here

# Database
DB_PATH=workout_data.db
DB_BACKUP_ENABLED=true

# Voice Settings
VOICE_LANGUAGE=he-IL
VOICE_MODEL=whisper
TTS_VOICE=avri

# Security
SECRET_KEY=generate_secure_random_key
JWT_ALGORITHM=HS256
SESSION_TIMEOUT=3600

# Features
ENABLE_SOCIAL_FEATURES=false
ENABLE_CLOUD_SYNC=false
ENABLE_ANALYTICS=true
```

#### Security Configuration
```python
# src/utils/security.py
import secrets
import hashlib
from cryptography.fernet import Fernet

class SecurityManager:
    """Handle sensitive data encryption"""
    
    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def hash_user_id(self, user_data: str) -> str:
        """Create anonymous user ID"""
        return hashlib.sha256(user_data.encode()).hexdigest()[:16]
```

### 6. Testing Framework

#### Test Structure
```python
# tests/test_exercise_tracking.py
import pytest
from src.core.exercise_tracker import ExerciseTracker
from src.core.database import DatabaseManager

class TestExerciseTracking:
    @pytest.fixture
    def tracker(self):
        """Create test tracker with in-memory database"""
        return ExerciseTracker(":memory:")
    
    def test_exercise_logging(self, tracker):
        """Test basic exercise logging"""
        entry = tracker.log_exercise("שכיבות סמיכה", 20)
        assert entry.reps == 20
        assert entry.points == 40
    
    def test_analytics_generation(self, tracker):
        """Test analytics calculation"""
        # Add test data
        tracker.log_exercise("שכיבות סמיכה", 20)
        tracker.log_exercise("סקוואטים", 15)
        
        analytics = tracker.get_analytics()
        assert analytics["total_points"] == 85
```

### 7. Migration Scripts

#### Data Migration
```python
# scripts/migrate_data.py
"""Migrate data from old format to new structure"""

def migrate_legacy_database():
    """Migrate from old SQLite structure"""
    
def backup_user_data():
    """Create backup before migration"""
    
def validate_migration():
    """Ensure data integrity after migration"""
```

## 🎯 Cleanup Execution Plan

### Week 1: File Organization
1. Create new directory structure
2. Move and rename core files
3. Archive legacy versions
4. Update import statements

### Week 2: Code Consolidation
1. Implement unified configuration
2. Refactor core modules
3. Create proper abstractions
4. Add error handling

### Week 3: Documentation & Testing
1. Write comprehensive README
2. Create API documentation
3. Implement test suite
4. Add security measures

### Week 4: Polish & Validation
1. Performance optimization
2. Code review and cleanup
3. Final testing
4. Deployment preparation

## 🔍 Quality Assurance

### Code Quality Standards
- Type hints for all functions
- Docstrings for all modules
- Error handling with specific exceptions
- Logging for debugging
- Configuration validation

### Performance Standards
- App startup < 3 seconds
- Voice recognition < 500ms latency
- Database queries < 100ms
- Memory usage < 200MB
- Battery usage minimal on mobile