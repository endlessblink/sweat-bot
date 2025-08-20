# Backend Engineer Role Definition

## Role: Backend Engineer
## Project: SweatBot - Hebrew Fitness Tracking System

### Primary Responsibilities
- Design and implement REST API endpoints for fitness tracking
- Manage database schemas and migrations (PostgreSQL)
- Implement WebSocket connections for real-time updates
- Handle session management and authentication
- Integrate with Redis for caching and pub/sub
- Ensure data persistence and integrity

### Technical Scope
- **Languages**: Python (FastAPI), TypeScript (Node.js)
- **Databases**: PostgreSQL, Redis
- **APIs**: RESTful services, WebSocket, GraphQL (optional)
- **Authentication**: JWT, OAuth2
- **Testing**: Pytest, Jest for API tests

### Key Components to Own
1. `/backend/` - FastAPI application
2. `/src/services/` - Business logic services
3. `/src/infrastructure/` - Database and cache layers
4. `/migrations/` - Database migrations
5. `/tests/backend/` - Backend test suite

### Communication Interfaces
- Frontend Engineer: API contracts, WebSocket events
- AI Engineer: Data models for exercise tracking
- QA Engineer: Test coverage requirements

### Success Metrics
- API response time < 200ms
- 90% test coverage
- Zero data loss incidents
- 99.9% uptime

### Current Status
- [ ] API design documented
- [ ] Database schema created
- [ ] Core endpoints implemented
- [ ] WebSocket integration complete
- [ ] Authentication system ready