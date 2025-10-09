# Gemini Project Context: SweatBot

This document provides context for the Gemini agent to effectively assist with development tasks on the SweatBot project.

## 1. Project Overview

- **Name:** SweatBot
- **Description:** An intelligent Hebrew fitness tracking system with voice recognition, real-time coaching, and gamification.
- **Core Problem:** To provide a hands-free, voice-driven way for users to log and track their fitness activities in Hebrew.

## 2. Tech Stack

- **Backend:**
  - **Framework:** FastAPI (Python 3.11)
  - **Database:** PostgreSQL (managed with Alembic)
  - **Cache:** Redis
  - **Real-time:** WebSockets
  - **AI/Voice:** OpenAI Whisper, Groq, Anthropic, Google Generative AI
  - **Key Libraries:** SQLAlchemy, Pymongo, Passlib, Pydantic.
- **Frontend:**
  - **Framework:** React (Vite)
  - **Language:** TypeScript
  - **Styling:** Tailwind CSS
  - **Key Libraries:** `@assistant-ui/react`, `react-router-dom`, `recharts`.
- **Containerization:** Docker and Docker Compose.
- **Testing:**
  - **Backend:** `pytest`
  - **E2E:** Playwright (`tests/playwright`)

## 3. Project Structure

- `backend/`: The Python FastAPI application source code.
  - `app/main.py`: Main application entry point.
  - `requirements.txt`: Python dependencies.
- `personal-ui-vite/`: The React/TypeScript frontend application.
  - `src/`: Frontend source code.
  - `package.json`: Frontend dependencies and scripts.
- `config/`: Project configuration files.
  - `docker/`: Docker Compose files.
- `scripts/`: Utility and automation scripts.
- `docs/`: Project documentation.
- `Makefile`: Central hub for common development commands.
- `tests/playwright/`: End-to-end tests.

## 4. Key Commands

The `Makefile` provides the primary interface for managing the project.

- **Start all services:**
  ```bash
  make start
  ```
- **Stop all services:**
  ```bash
  make stop
  ```
- **Start in development mode (with hot-reloading):**
  ```bash
  make dev
  ```
- **Install all dependencies:**
  ```bash
  make install
  ```
- **Run all tests:**
  ```bash
  make test
  ```
- **Run backend tests only:**
  ```bash
  cd backend && pytest
  ```
- **Run E2E tests only:**
  ```bash
  cd tests/playwright && npm test
  ```
- **Start individual services:**
  ```bash
  make backend
  make frontend
  make db-start
  ```
- **View logs:**
  ```bash
  make logs
  ```

## 5. Development Conventions

- **Environment:** Use `.env` file for local configuration (copy from `.env.example`).
- **Backend Dependencies:** Managed via `pip` and `backend/requirements.txt`.
- **Frontend Dependencies:** Managed via `npm` (or `bun`) and `personal-ui-vite/package.json`.
- **Database Migrations:** Use `alembic` for schema changes.
- **Primary Workflow:** Use `make` commands for consistency. Docker is the recommended method for running the full stack.
