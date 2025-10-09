We keep all important docs in .agent folder and keep updating them, structure like below

.agent
 - Tasks: PRD & implementation plan for each feature
 - System: Document the current state of the system (project structure, tech stack, integration points, database schema, and core functionalities such as agent architecture, LLM layer, etc.)
 - SOP: Best practices of execute certain tasks (e.g. how to add a schema migration, how to add a new page route, etc.)
 - index.md: an index of all the documentations we have so people know what & where to look for things

We should always update .agent docs after we implement certain feature, to make sure it fully reflect the up to date information

Before you plan any implementation, always read the .agent/index.md first to get context




# SweatBot Development Guidelines

## Build/Lint/Test Commands

### Frontend (TypeScript/React - Vite)
```bash
cd personal-ui-vite
npm run dev          # Start dev server (port 8005)
npm run build        # TypeScript compile + Vite build
npm run lint         # ESLint check (strict mode)
npm run preview      # Preview production build
```

### Backend (Python/FastAPI)
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload  # Start dev server
pytest               # Run all tests
pytest path/to/test_file.py  # Run single test file
pytest path/to/test_file.py::test_function_name  # Run single test function
python -m pytest -v  # Verbose output
python -m pytest -vv -s  # Extra verbose with print statements
```

### Full System (Makefile)
```bash
make start           # Start databases + backend + frontend
make dev             # Development mode with auto-reload
make test            # Run all tests (backend pytest + playwright)
make backend         # Start backend only (auto-starts databases)
make frontend        # Start frontend only
make health          # Check service health (curl endpoints)
make clean           # Remove __pycache__, logs, screenshots
```

## Code Style Guidelines

### Python (Backend - FastAPI)
- **Imports**: Standard library → third-party → local (app.core, app.api, app.services)
- **Async patterns**: Use async/await for all database/external API operations
- **Models**: Pydantic v2 for request/response, SQLAlchemy for database
- **Error handling**: Raise HTTPException with proper status codes (400, 404, 422, 500)
- **Logging**: Use structlog with context (user_id, request_id, etc.)
- **Type hints**: Required for all function signatures
- **Hebrew strings**: UTF-8 encoding mandatory, test with Hebrew characters

### TypeScript (Frontend - React + Vite)
- **Strict mode**: noUnusedLocals, noUnusedParameters, strict: true enforced
- **Components**: Functional components with hooks (no class components)
- **Imports**: React/React Router → third-party (@assistant-ui, openai, groq) → local (./components, ./services)
- **Types**: Explicit types for props, Zod schemas for API validation
- **Styling**: Tailwind CSS only (no inline styles, use clsx/tailwind-merge)
- **State**: React hooks (useState, useEffect) or context, avoid prop drilling
- **Hebrew/RTL**: Support bidirectional text, test with Hebrew input

### Naming Conventions
- **Python**: snake_case (functions, variables), PascalCase (classes), UPPER_CASE (constants)
- **TypeScript**: camelCase (functions, variables), PascalCase (components, types), UPPER_SNAKE_CASE (constants)
- **Files**: kebab-case (React components), snake_case (Python modules)
- **Database**: snake_case for tables/columns, plural table names (users, exercises)

### Critical Requirements
- **Ports**: Backend 8000, Frontend 8005 (NO OTHER PORTS)
- **Databases**: PostgreSQL (8020), MongoDB (27017), Redis (6379) via Docker
- **Screenshots**: Save to `docs/screenshots-debug/` with descriptive names
- **Hebrew support**: Mandatory for all user-facing text, test with real Hebrew data
- **Testing**: MUST test functionality before claiming it works (no assumptions)
- **NO demo data**: Use real or realistic test data during development
- **Error messages**: Bilingual (Hebrew + English) for user-facing errors



