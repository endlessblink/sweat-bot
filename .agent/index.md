# SweatBot Development Documentation Index

## 📖 Project Overview

**SweatBot** is a comprehensive Hebrew fitness tracking AI system featuring voice recognition, real-time coaching, exercise tracking, and gamification. It uses a hybrid architecture with TypeScript frontend (Volt Agent) and Python FastAPI backend.

### Quick Links
- **🚀 Quick Start**: See `system/project_architecture.md` for setup
- **🛠️ Development**: See `system/development_workflow.md` for daily tasks  
- **📋 SOPs**: See `sop/` directory for standard procedures
- **🎯 Features**: See `tasks/` directory for feature specifications

---

## 📁 Documentation Structure

### 🏗️ System Architecture & Core Documentation
| File | Purpose | For Engineers Who Need... |
|------|---------|---------------------------|
| [`system/project_architecture.md`](./system/project_architecture.md) | Complete system overview, tech stack, and architecture | Full project context, tech stack understanding |
| [`system/database_schema.md`](./system/database_schema.md) | Database schemas for PostgreSQL, MongoDB, Redis | Data layer understanding, database operations |
| [`system/development_workflow.md`](./system/development_workflow.md) | Daily development workflow and best practices | How to work on the project effectively |
| [`system/ai_architecture.md`](./system/ai_architecture.md) | Volt Agent architecture and AI provider management | AI/ML integration understanding |

### 🎯 Feature Specifications & Implementation Plans
| File | Purpose | Status |
|------|---------|--------|
| [`tasks/profile_wizard_implementation_summary.md`](./tasks/profile_wizard_implementation_summary.md) | User profile management & personalized workout generation | ✅ **Completed & Verified** |
| [`tasks/points_system_implementation_summary.md`](./tasks/points_system_implementation_summary.md) | Scalable points system v2.0 implementation complete | ✅ Completed |
| [`tasks/voice_control_prd.md`](./tasks/voice_control_prd.md) | Voice recognition feature PRD | Planning |
| [`tasks/mobile_app_prd.md`](./tasks/mobile_app_prd.md) | PWA/mobile app feature PRD | Planning |
| [`tasks/gamification_system.md`](./tasks/gamification_system.md) | Points, achievements, and gamification features | In Progress |
| [`tasks/hebrew_nlp_features.md`](./tasks/hebrew_nlp_features.md) | Hebrew language processing enhancements | Planning |

### 📋 Standard Operating Procedures (SOPs)
| File | Purpose | For Engineers Who Need... |
|------|---------|---------------------------|
| [`sop/database_migrations.md`](./sop/database_migrations.md) | How to handle database schema changes | Database modifications |
| [`sop/adding_new_exercises.md`](./sop/adding_new_exercises.md) | How to add new exercise types | Content management |
| [`sop/hebrew_localization.md`](./sop/hebrew_localization.md) | Hebrew language support procedures | Localization work |
| [`sop/api_endpoint_creation.md`](./sop/api_endpoint_creation.md) | How to create new API endpoints | Backend development |
| [`sop/frontend_component_creation.md`](./sop/frontend_component_creation.md) | How to create new UI components | Frontend development |
| [`sop/testing_procedures.md`](./sop/testing_procedures.md) | Testing standards and procedures | Quality assurance |

---

## 🏗️ System Architecture Summary

### Technology Stack
- **Backend**: FastAPI + Python 3.11 (Port 8000)
- **Frontend**: Vite + React + TypeScript (Port 8005) 
- **AI Framework**: Custom Volt Agent (TypeScript)
- **Databases**: 
  - PostgreSQL (Port 8001) - Exercise data & statistics
  - MongoDB (Port 8002) - Conversation history
  - Redis (Port 8003) - Session cache
- **AI APIs**: Google Gemini (primary), Groq (fallback)
- **Deployment**: Docker for databases, local dev for app layer

### Key Architectural Patterns
1. **Hybrid Deployment**: Cloud AI APIs with local data persistence
2. **Tool-Based AI**: Volt Agent with 6 intelligent tools for fitness tracking
3. **Multi-Database Strategy**: Specialized databases for different data types
4. **Real-time Features**: WebSocket for live coaching and updates
5. **Hebrew-First Design**: RTL support and Hebrew language optimization

### Port Configuration (CRITICAL)
- **8000**: Backend API (FastAPI)
- **8001**: PostgreSQL Database
- **8002**: MongoDB (Conversations)
- **8003**: Redis (Cache)
- **8005**: Frontend with Volt Agent
- **8006**: Reserved for local AI models

---

## 🚀 Quick Start for New Engineers

### 1. Environment Setup
```bash
# Clone and navigate
git clone <repository-url>
cd sweatbot

# Copy environment files
cp .env.example .env
cp personal-ui-vite/.env.example personal-ui-vite/.env

# Start databases
docker-compose -f config/docker/docker-compose.yml up -d

# Install dependencies
make install

# Start all services
make start
```

### 2. Verify Installation
- Backend: http://localhost:8000/health
- Frontend: http://localhost:8005
- Design System: http://localhost:8005/design-system

### 3. First Development Tasks
1. Read `system/development_workflow.md`
2. Review the current architecture in `system/project_architecture.md`
3. Check existing features in `tasks/` directory
4. Follow relevant SOPs in `sop/` directory

---

## 🎯 Current Development Focus

### Recently Completed ✅
1. **Profile Wizard** - User profiling system with 4-step wizard and personalized workout generation (Oct 2025)
2. **Exercise Database Expansion** - 132 no-equipment exercises with Hebrew localization (Oct 2025)
3. **Scalable Points System v2.0** - Complete points configuration and tracking system (Sep 2025)

### High Priority Features
1. **Voice Control** - Hebrew voice recognition for hands-free workout logging
2. **Mobile PWA** - Progressive Web App for mobile-first experience
3. **Profile Wizard Integration** - Add profile wizard to user onboarding flow

### Code Quality Priorities
1. **Testing** - Comprehensive E2E testing with Playwright
2. **Hebrew Localization** - Complete RTL and Hebrew language support
3. **Performance** - Optimization for mobile devices and slow connections

### Infrastructure Improvements
1. **Error Handling** - Better error messages and recovery
2. **Monitoring** - Health checks and performance metrics
3. **Documentation** - Keep this documentation updated

---

## 📞 Getting Help & Contributing

### For Code Questions
1. Check relevant SOP in `sop/` directory
2. Review `system/development_workflow.md`
3. Look at existing implementations in the codebase

### For Architecture Questions  
1. Read `system/project_architecture.md`
2. Check `system/database_schema.md`
3. Review feature PRDs in `tasks/` directory

### For Adding New Documentation
1. Follow the existing structure in this index
2. Update this `index.md` when adding new files
3. Keep documentation focused and actionable

### Documentation Updates
- **Version**: 1.1.0
- **Last Updated**: 2025-10-10
- **Maintainer**: Development Team
- **Review Cycle**: Monthly or after major feature releases

### Recent Changes (October 10, 2025)
- ✅ Added profile wizard implementation summary
- ✅ Verified profile wizard UI with browser E2E testing
- ✅ Expanded exercise database to 132 exercises
- ✅ Created comprehensive testing documentation with screenshots

---

## 🔧 Critical Development Guidelines

### MUST Follow
- **Ports 8000-8020 ONLY** - No other ports allowed
- **Hebrew Language Support** - All user-facing features must support Hebrew
- **Design System Usage** - Use tokens from `/src/design-system/tokens.ts` only
- **E2E Testing Required** - Never claim functionality works without Playwright testing
- **No Demo Data** - Test with real data only

### MUST Avoid
- **Hardcoded UI Values** - Use design tokens exclusively
- **Pattern Matching** - Let AI understand language naturally
- **Assumptions** - Test everything before claiming it works
- **Mixed Languages** - Keep Hebrew and English separate in code

---

## 📊 Project Health Dashboard

### System Status
- ✅ **Backend API**: Operational (FastAPI)
- ✅ **Frontend**: Operational (Vite + React)
- ✅ **Databases**: Operational (PostgreSQL, MongoDB, Redis)
- ✅ **AI Integration**: Operational (Gemini + Groq)
- ✅ **Profile Wizard**: Operational & Verified (Oct 2025)
- ✅ **Personalized Workouts**: Operational (Oct 2025)
- 🔄 **Voice Control**: In Development
- 🔄 **Mobile PWA**: In Development

### Code Quality
- ✅ **TypeScript**: Strict mode enabled
- ✅ **Python**: Type hints required
- ✅ **Testing**: E2E with Playwright
- ✅ **Documentation**: Comprehensive
- 🔄 **Coverage**: Improving

---

*This index is maintained by the development team. Please keep it updated when adding new features or documentation.*