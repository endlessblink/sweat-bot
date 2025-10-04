# SweatBot Development Guidelines

## Build/Lint/Test Commands

### Frontend (TypeScript/React)
```bash
cd personal-ui-vite
npm run dev          # Start dev server (port 8005)
npm run build        # Build for production
npm run lint         # ESLint check
npm run preview      # Preview production build
```

### Backend (Python/FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # Start dev server
pytest               # Run all tests
pytest test_file.py  # Run single test
python -m pytest -v  # Verbose test output
```

### Full System
```bash
make start           # Start all services
make test            # Run all tests
make backend         # Start backend only
make frontend        # Start frontend only
make health          # Check service health
```

## Code Style Guidelines

### Python (Backend)
- Use FastAPI dependency injection patterns
- Async/await for all database operations
- Pydantic models for request/response validation
- Hebrew strings must use UTF-8 encoding
- Error handling with proper HTTP status codes
- Log with structlog, include context

### TypeScript (Frontend)
- Strict TypeScript enabled (noUnusedLocals, noUnusedParameters)
- React functional components with hooks
- Zod schemas for type validation
- Tailwind CSS for styling (no inline styles)
- Hebrew/English bilingual support required
- Import order: React → third-party → local components

### Naming Conventions
- Python: snake_case for variables/functions, PascalCase for classes
- TypeScript: camelCase for variables/functions, PascalCase for components
- Database: snake_case for tables/columns
- Files: kebab-case for components, snake_case for utilities

### Critical Requirements
- Port range: 8000-8020 ONLY (8000=backend, 8005=frontend)
- All screenshots to docs/screenshots-debug/
- NO demo data during development
- Hebrew language support mandatory
- Test before claiming functionality works