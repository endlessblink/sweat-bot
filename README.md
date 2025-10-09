# SweatBot 💪 - Hebrew Fitness AI Tracker

An intelligent Hebrew fitness tracking system with voice recognition, real-time coaching, and gamification.

## 📚 Documentation

**🚨 New engineers**: Start with the [`.agent/`](.agent/) directory for complete project documentation

### Quick Documentation Links
- **🏗️ System Architecture**: [`.agent/system/project_architecture.md`](.agent/system/project_architecture.md) - Complete tech overview
- **🗄️ Database Schema**: [`.agent/system/database_schema.md`](.agent/system/database_schema.md) - Data layer documentation  
- **🛠️ Development Workflow**: [`.agent/system/development_workflow.md`](.agent/system/development_workflow.md) - Daily development guide
- **📋 SOPs**: [`.agent/sop/`](.agent/sop/) directory - Standard operating procedures
- **🎯 Features**: [`.agent/tasks/`](.agent/tasks/) directory - Feature specifications and PRDs

### Key Resources for Engineers
1. **Project Setup**: Follow the [Development Workflow](.agent/system/development_workflow.md) for environment setup
2. **Code Standards**: See [Development Standards](.agent/system/development_workflow.md#-coding-standards) for Python/TypeScript requirements
3. **Database Changes**: Follow [Database Migration SOP](.agent/sop/database_migrations.md) for any schema modifications
4. **New Exercises**: Follow [Adding New Exercises SOP](.agent/sop/adding_new_exercises.md) for exercise integration
5. **Feature Development**: Check [Tasks Directory](.agent/tasks/) for PRDs and implementation plans

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone and setup
git clone <repository-url>
cd sweatbot

# Copy environment file and configure
cp .env.example .env
# Edit .env with your settings

# Start all services
docker-compose up -d

# Check services status
docker-compose ps
```

### Manual Development Setup

```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Database setup
createdb sweatbot
alembic upgrade head

# Start backend
uvicorn app.main:app --reload

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture

### Technology Stack

- **Backend**: FastAPI + Python 3.11
- **Database**: PostgreSQL with AsyncPG
- **Cache**: Redis
- **AI/Voice**: OpenAI Whisper for Hebrew transcription
- **Real-time**: WebSocket connections
- **Frontend**: Next.js + TypeScript
- **Deployment**: Docker + Docker Compose

### Service Architecture

```
┌─────────────────────────────────┐
│       Frontend (Next.js)        │
├─────────────────────────────────┤
│         API Gateway             │
├─────────────────────────────────┤
│    Backend Services (FastAPI)   │
├─────────────────────────────────┤
│   Database  │  Cache  │  Queue  │
└─────────────────────────────────┘
```

## 🎯 Core Features

### 1. Hebrew Voice Recognition
- Real-time Hebrew voice transcription using Whisper
- Exercise command parsing: "עשיתי 20 סקוואטים"
- Support for exercise variations and Hebrew numbers

### 2. Exercise Tracking
- Comprehensive exercise logging
- Personal record detection
- Workout session management
- Historical data and analytics

### 3. Gamification System
- Points and leveling system
- Achievements and badges
- Daily challenges
- Streak tracking
- Leaderboards

### 4. Real-time Features
- WebSocket-based real-time updates
- Live coaching feedback
- Achievement notifications
- Progress updates

## 📊 Development Methodologies

This project uses both **Squad Engineering** and **BMAD Method** for structured development:

### Squad Engineering Roles
- **Backend Developer**: API design and database management
- **Frontend Developer**: UI/UX and client-side features
- **AI Engineer**: Voice processing and ML models
- **QA Engineer**: Testing and quality assurance

### BMAD Agents Available
```bash
# Run different BMAD agents
npm run bmad:analyst      # Business analysis
npm run bmad:pm          # Product management
npm run bmad:architect   # System architecture
npm run bmad:scrum       # Sprint planning
npm run bmad:developer   # Development tasks
npm run bmad:qa          # Quality assurance

# Integrated BMAD-Squad commands
npm run bmad-squad:team  # Team coordination
npm run bmad-squad:feature  # Feature development
npm run bmad-squad:sprint   # Sprint management
```

## 🛠️ API Documentation

### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Current user info
- `POST /auth/guest` - Create guest session

### Exercise Endpoints
- `POST /exercises/log` - Log exercise with Hebrew support
- `GET /exercises/history` - Exercise history
- `GET /exercises/statistics` - User statistics
- `GET /exercises/personal-records` - Personal records
- `POST /exercises/parse-hebrew` - Parse Hebrew commands

### WebSocket Events
- `client:voice_chunk` - Stream audio for transcription
- `client:exercise_log` - Log exercise via WebSocket
- `server:achievement` - Achievement notifications
- `server:stats_update` - Real-time stats updates

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test

# Integration tests
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📦 Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
# Use production profile
docker-compose --profile production up -d

# With monitoring
docker-compose --profile production --profile monitoring up -d
```

### Environment Profiles
- `default`: Development with hot reload
- `production`: Optimized production build
- `monitoring`: Prometheus + Grafana
- `storage`: MinIO object storage

## 🌍 Hebrew Language Support

### Supported Exercise Types
- **כוח (Strength)**: סקוואט, שכיבות סמיכה, דדליפט
- **קרדיו (Cardio)**: ריצה, אופניים, שחייה
- **פונקציונלי (Functional)**: ברפי, פלאנק, לאנג'ים

### Voice Command Examples
```
"עשיתי 20 סקוואטים"
"ביצעתי 3 סטים של 10 שכיבות סמיכה"
"רצתי 5 קילומטר ב-25 דקות"
"הרמתי 50 קילו בק סקווט"
```

## 🔧 Configuration

### Key Environment Variables
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/sweatbot

# AI Configuration
WHISPER_MODEL_SIZE=base  # tiny, base, small, medium, large

# Security
SECRET_KEY=your-256-bit-secret-key
```

### Model Configuration
- **Whisper Model**: Configurable size (tiny to large)
- **Hebrew Optimization**: Custom vocabulary and grammar rules
- **Performance**: Model caching and warm-up strategies

## 📈 Monitoring

### Health Checks
- `GET /health` - Application health
- `GET /auth/health` - Authentication service
- Database connection status
- Redis connectivity

### Metrics (Prometheus)
- Request latency and throughput
- WebSocket connection counts
- Voice processing duration
- Database query performance

## 🤝 Contributing

1. Follow Squad Engineering principles
2. Use BMAD agents for planning
3. Write tests for new features
4. Update documentation
5. Ensure Hebrew language support

### Development Workflow
```bash
# Plan with BMAD agents
npm run bmad:pm prioritize

# Coordinate with Squad
npm run squad:sync

# Implement with appropriate agent
npm run bmad:developer implement feature-name

# Test and validate
npm run bmad:qa validate
```

## 📋 License

MIT License - See LICENSE file for details.

---

Built with ❤️ for the Hebrew fitness community using Squad Engineering and BMAD methodologies.