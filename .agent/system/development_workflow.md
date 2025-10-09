# SweatBot Development Workflow

## 🚀 Daily Development Workflow

This guide outlines the standard workflow for developers working on the SweatBot project.

---

## 📋 Pre-Development Checklist

### Environment Setup
Before starting any development work, verify your environment:

```bash
# 1. Check all services are running
make health

# 2. Verify database connections
docker-compose -f config/docker/docker-compose.yml ps

# 3. Test API endpoints
curl http://localhost:8000/health

# 4. Check frontend loads
curl http://localhost:8005
```

### Required Tools
- **Node.js 18+** and **npm** for frontend
- **Python 3.11+** and **pip** for backend  
- **Docker & Docker Compose** for databases
- **Git** for version control
- **VS Code** (recommended) with extensions:
  - Python
  - TypeScript/JavaScript
  - Docker
  - Tailwind CSS

---

## 🌅 Starting Development

### 1. Morning Setup
```bash
# Navigate to project
cd sweatbot

# Start all services
make start

# Open separate terminals for logs
make logs

# Verify everything works
make test
```

### 2. Branch Management
```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/descriptive-name

# Use conventional commits
git commit -m "feat: add hebrew exercise parser improvement"
git commit -m "fix: resolve mongodb connection timeout"
git commit -m "docs: update api documentation"
```

### 3. Development Environment
- **Backend**: FastAPI with auto-reload on port 8000
- **Frontend**: Vite dev server on port 8005
- **Databases**: PostgreSQL (8001), MongoDB (8002), Redis (8003)
- **AI Testing**: Use `/volt` page for AI debugging

---

## 💻 Coding Standards

### Python (Backend)
```python
# Import order: standard library → third-party → local
import asyncio
import logging
from datetime import datetime

from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.models import Exercise

# Use type hints everywhere
async def create_exercise(
    exercise_data: ExerciseCreate,
    db: Session,
    user_id: int
) -> Exercise:
    """Create a new exercise with validation."""
    # Always validate inputs
    if not exercise_data.exercise_name:
        raise HTTPException(status_code=400, detail="Exercise name required")
    
    # Use async for database operations
    exercise = Exercise(
        user_id=user_id,
        exercise_name=exercise_data.exercise_name,
        created_at=datetime.utcnow()
    )
    
    db.add(exercise)
    await db.commit()
    await db.refresh(exercise)
    
    return exercise

# Use structured logging
logger.info(f"Created exercise {exercise.id} for user {user_id}")
```

### TypeScript (Frontend)
```typescript
// Import order: React → third-party → local
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { designTokens } from '../design-system/tokens';
import { Button, Card } from '../design-system/components/base';
import { useSweatBotAgent } from '../agent';

// Use explicit interfaces
interface ExerciseData {
  name: string;
  reps: number;
  points: number;
}

export const ExerciseLogger: React.FC = () => {
  const [exercise, setExercise] = useState<ExerciseData | null>(null);
  const agent = useSweatBotAgent();
  
  // Use design tokens, never hardcoded values
  const cardStyle = {
    backgroundColor: designTokens.colors.background.secondary,
    padding: designTokens.spacing[4],
    borderRadius: designTokens.borderRadius.md
  };
  
  // Error handling with user feedback
  const handleExerciseLog = async (data: ExerciseData) => {
    try {
      const result = await agent.logExercise(data);
      setExercise(result);
    } catch (error) {
      console.error('Failed to log exercise:', error);
      // Show user-friendly error message
    }
  };
  
  return (
    <Card style={cardStyle}>
      <Button 
        variant="primary"
        onClick={() => handleExerciseLog(exercise)}
      >
        Log Exercise
      </Button>
    </Card>
  );
};
```

### Database Operations
```python
# Always use service layer for database operations
from app.services.exercise_service import ExerciseService

class ExerciseService:
    def __init__(self, db: Session):
        self.db = db
    
    async def get_user_exercises(
        self, 
        user_id: int, 
        limit: int = 50
    ) -> List[Exercise]:
        """Get user's exercises with pagination."""
        query = (
            self.db.query(Exercise)
            .filter(Exercise.user_id == user_id)
            .order_by(Exercise.created_at.desc())
            .limit(limit)
        )
        return query.all()
    
    async def create_exercise_with_points(
        self,
        exercise_data: ExerciseCreate,
        user_id: int
    ) -> Exercise:
        """Create exercise and calculate points."""
        # Business logic in service layer
        points = self.calculate_exercise_points(exercise_data)
        
        exercise = Exercise(
            user_id=user_id,
            **exercise_data.dict(),
            points_earned=points
        )
        
        self.db.add(exercise)
        await self.db.commit()
        await self.db.refresh(exercise)
        
        # Update user statistics
        await self.update_user_stats(user_id, points)
        
        return exercise
```

---

## 🧪 Testing Workflow

### 1. Unit Tests
```bash
# Backend tests
cd backend
pytest tests/test_exercise_service.py -v
pytest tests/test_hebrew_parser.py -v

# Frontend tests  
cd personal-ui-vite
npm test -- ExerciseLogger.test.tsx
npm test -- --coverage
```

### 2. Integration Tests
```bash
# API endpoint testing
cd backend
pytest tests/test_api_integration.py -v

# Database integration
pytest tests/test_database_integration.py -v
```

### 3. End-to-End Testing (CRITICAL)
```bash
# Use Playwright MCP for full E2E testing
# Test core user flows:
# 1. User registration/login
# 2. Exercise logging via chat
# 3. Statistics viewing
# 4. Goal setting and tracking

# NEVER claim functionality works without E2E testing!
```

### Testing Requirements
- **Backend**: 80%+ test coverage required
- **Frontend**: Component tests for all major components
- **E2E**: All user flows must pass automated tests
- **Hebrew**: Test with Hebrew text and RTL layout

---

## 🔍 Debugging Process

### 1. Backend Debugging
```python
# Use structured logging
import logging

logger = logging.getLogger(__name__)

async def debug_exercise_parsing(user_input: str):
    logger.info(f"Parsing exercise input: {user_input}")
    
    try:
        result = await hebrew_parser.parse(user_input)
        logger.debug(f"Parsed result: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to parse exercise: {e}", exc_info=True)
        raise
```

### 2. Frontend Debugging
```typescript
// Use React DevTools and browser console
const DebugExerciseLogger: React.FC = () => {
  const [debug, setDebug] = useState(false);
  
  useEffect(() => {
    if (debug) {
      console.log('ExerciseLogger mounted');
      // Add debug event listeners
    }
  }, [debug]);
  
  return (
    <>
      {debug && (
        <div style={{ position: 'fixed', top: 0, right: 0, zIndex: 9999 }}>
          Debug Panel
        </div>
      )}
    </>
  );
};
```

### 3. Database Debugging
```bash
# PostgreSQL
docker exec -it sweatbot_postgres psql -U fitness_user -d hebrew_fitness
\dt  # List tables
SELECT * FROM exercises WHERE user_id = 1 ORDER BY created_at DESC LIMIT 5;

# MongoDB  
docker exec -it sweatbot_mongodb mongosh
use sweatbot_conversations
db.conversations.find({userId: 1}).pretty();

# Redis
docker exec -it sweatbot_redis redis-cli
KEYS user_*
GET user_state:1
```

---

## 📝 Code Review Process

### Before Submitting PR
1. **Run full test suite**: `make test`
2. **Check code formatting**: 
   - Python: `black . && isort .`
   - TypeScript: `npm run lint && npm run format`
3. **Update documentation**: Add/update relevant docs
4. **Verify functionality**: Manual testing of changes
5. **Check Hebrew support**: Test with Hebrew input

### PR Checklist
- [ ] Tests pass for all changes
- [ ] Code follows project standards
- [ ] Documentation is updated
- [ ] Hebrew language support verified
- [ ] No hardcoded values (use design tokens)
- [ ] Database migrations included if needed
- [ ] E2E tests updated for new features

### Review Focus Areas
- **Security**: No exposed credentials, proper validation
- **Performance**: No N+1 queries, efficient database usage
- **Accessibility**: RTL support, proper ARIA labels
- **Hebrew Support**: UTF-8 handling, text direction
- **Error Handling**: User-friendly error messages

---

## 🚀 Deployment Workflow

### 1. Pre-deployment Checks
```bash
# Run full test suite
make test

# Check environment variables
env | grep -E "(DATABASE|API_KEY|SECRET)"

# Verify database migrations
cd backend && alembic current
cd backend && alembic upgrade head

# Build frontend for production
cd personal-ui-vite && npm run build
```

### 2. Deployment Steps
```bash
# Backup databases
docker exec sweatbot_postgres pg_dump -U fitness_user hebrew_fitness > backup.sql
docker exec sweatbot_mongodb mongodump --db sweatbot_conversations

# Update application
git pull origin main
make install  # Update dependencies
make restart  # Restart services

# Verify deployment
make health
curl http://localhost:8000/health/detailed
```

### 3. Post-deployment Verification
- Check all services are running
- Verify database connectivity
- Test core user flows
- Monitor error logs
- Check Hebrew functionality

---

## 🔧 Common Development Tasks

### Adding New Exercise Type
1. Update exercise database schema
2. Add exercise to hebrew parser
3. Update frontend exercise list
4. Add points calculation logic
5. Write tests for new exercise
6. Update documentation

### Adding New AI Tool
1. Create tool in `personal-ui-vite/src/agent/tools/`
2. Implement tool interface with TypeScript
3. Add tool to Volt Agent registry
4. Update tool selection logic
5. Write unit and integration tests
6. Add to tool documentation

### Database Schema Changes
1. Create Alembic migration
2. Update SQLAlchemy models
3. Update Pydantic schemas
4. Update service layer
5. Write migration tests
6. Document changes

### Adding New API Endpoint
1. Define Pydantic models
2. Implement service layer logic
3. Create API route handler
4. Add authentication if needed
5. Write API tests
6. Update API documentation

---

## 📊 Performance Monitoring

### Key Metrics to Monitor
- **API Response Time**: < 200ms average
- **Database Query Time**: < 100ms average
- **Frontend Load Time**: < 3s initial load
- **AI Response Time**: < 5s for tool operations
- **Memory Usage**: < 1GB for development

### Monitoring Tools
- **Backend**: FastAPI built-in metrics `/metrics`
- **Database**: Query logs and explain plans
- **Frontend**: React DevTools Profiler
- **System**: Docker stats and resource usage

---

## 🔄 Git Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `refactor/description` - Code refactoring
- `hotfix/description` - Critical fixes

### Commit Message Format
```
type(scope): description

feat(auth): add Hebrew login support
fix(parser): resolve exercise name recognition
docs(api): update endpoint documentation
refactor(db): optimize exercise queries
```

### Merge Strategy
- **Main branch**: Always stable, deployable
- **Feature branches**: Merge via pull requests
- **Hotfixes**: Direct merge to main with review
- **Release tags**: Tag stable versions

---

## 🚨 Troubleshooting Guide

### Common Issues

**Backend won't start**
```bash
# Check port conflicts
lsof -i :8000
# Check database connections
docker-compose logs postgres
# Verify environment variables
env | grep DATABASE
```

**Frontend build errors**
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install
# Check TypeScript errors
npm run type-check
```

**Database connection issues**
```bash
# Restart databases
docker-compose restart postgres mongodb redis
# Check connection strings
docker exec sweatbot_postgres pg_isready
```

**Hebrew text issues**
```bash
# Check encoding
locale
# Verify UTF-8 support in database
docker exec sweatbot_postgres psql -l
```

### Getting Help
1. Check project documentation in `.agent/`
2. Search existing issues in Git history
3. Ask in team chat with specific error details
4. Include logs, steps to reproduce, and environment info

---

This workflow ensures consistent, high-quality development while maintaining the project's Hebrew language support and performance standards.