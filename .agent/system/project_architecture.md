# SweatBot Project Architecture

## 🏗️ System Overview

SweatBot is a Hebrew fitness tracking AI system that combines modern web technologies with advanced AI capabilities to provide intelligent fitness coaching in Hebrew.

### Core Mission
Provide Hebrew-speaking users with an intelligent fitness companion that can:
- Understand and log exercises through natural conversation (Hebrew/English)
- Track progress and provide personalized insights
- Offer real-time coaching and motivation
- Gamify fitness with points and achievements

## 🎯 Technology Stack

### Frontend Layer (Port 8005)
- **Framework**: Vite + React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **AI Integration**: Custom Volt Agent (TypeScript)
- **State Management**: React hooks + Context API
- **Routing**: React Router v6
- **Real-time**: WebSocket connection to backend

### Backend Layer (Port 8000)
- **Framework**: FastAPI + Python 3.11
- **Async Support**: Full async/await for high performance
- **Authentication**: JWT tokens with user management
- **API Documentation**: Automatic OpenAPI/Swagger
- **Real-time**: WebSocket support for live updates

### AI Layer
- **Primary AI**: Google Gemini API (gemini-1.5-pro)
- **Fallback AI**: Groq API (llama3-groq-70b-8192-tool-use-preview)
- **Local Models**: Optional support via port 8006
- **Voice Processing**: Planned Hebrew voice recognition
- **Tool System**: 6 intelligent TypeScript tools

### Data Layer
- **PostgreSQL** (Port 8001): Exercise data, user statistics, achievements
- **MongoDB** (Port 8002): Conversation history, AI context
- **Redis** (Port 8003): Session cache, real-time data

## 🏛️ Architecture Patterns

### 1. Hybrid Deployment Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Local)                         │
│  Vite + React + Volt Agent (Port 8005)                     │
│  ├── Direct AI API calls (Gemini/Groq)                      │
│  ├── WebSocket to backend                                   │
│  └── Client-side state management                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Local)                          │
│  FastAPI + Python (Port 8000)                              │
│  ├── REST API endpoints                                     │
│  ├── WebSocket management                                   │
│  ├── Business logic services                                │
│  └── Database orchestration                                 │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  PostgreSQL     │ │    MongoDB      │ │     Redis       │
│  (Port 8001)    │ │   (Port 8002)   │ │   (Port 8003)   │
│  - Exercises    │ │ - Conversations │ │ - Sessions      │
│  - Statistics   │ │ - Chat History  │ │ - Cache         │
│  - Users        │ │ - AI Context    │ │ - Real-time     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 2. AI Tool-Based Architecture
The Volt Agent uses intelligent tools that automatically execute based on user intent:

| Tool | Purpose | Trigger Examples |
|------|---------|------------------|
| **ExerciseLoggerTool** | Log exercises with points | "עשיתי 20 סקוואטים", "Just did 30 pushups" |
| **StatisticsRetrieverTool** | Get stats and progress | "כמה נקודות יש לי?", "Show my progress" |
| **DataManagerTool** | Reset/clear data safely | "אפס הכל", "Start fresh" |
| **GoalSetterTool** | Set and track goals | "אני רוצה להגיע ל-100 נקודות" |
| **ProgressAnalyzerTool** | Analyze trends | "איך אני מתקדם?", "Analyze my progress" |
| **WorkoutSuggesterTool** | Suggest workouts | "מה לעשות היום?", "What should I do?" |

### 3. Multi-Database Strategy
Each database serves a specific purpose optimized for its data type:

**PostgreSQL (Relational)**
- Structured exercise data
- User statistics and achievements
- Complex queries and reporting
- ACID compliance for data integrity

**MongoDB (Document)**
- Conversation history (flexible schema)
- AI context and session data
- Hierarchical chat structures
- Fast read/write for chat flows

**Redis (Key-Value)**
- Session management
- Real-time caching
- WebSocket connection state
- Temporary data storage

## 🔧 Service Communication

### API Endpoints Structure
```
/api/v1/
├── auth/          # Authentication & user management
├── exercises/     # Exercise logging and retrieval
├── chat/          # Chat endpoint for AI integration
├── memory/        # Conversation history management
├── onboarding/    # User onboarding flow
└── goals/         # Goal setting and tracking

WebSocket:
└── /ws           # Real-time updates and notifications
```

### Data Flow Patterns

1. **Exercise Logging Flow**
   ```
   User Input → Volt Agent → ExerciseLoggerTool → Backend API → PostgreSQL → Response
   ```

2. **Conversation Flow**
   ```
   User Message → Volt Agent → AI API (Gemini/Groq) → Tool Selection → Backend → MongoDB → UI Update
   ```

3. **Real-time Updates**
   ```
   Backend Event → WebSocket → Frontend → UI Component Update
   ```

## 🎨 Frontend Architecture

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── assistant/       # AI chat components
│   ├── ui/             # Base UI components (design system)
│   └── visualizations/ # Charts and data displays
├── pages/              # Route-level components
├── agent/              # Volt Agent implementation
│   ├── tools/          # AI tools (6 total)
│   ├── providers/      # AI API providers
│   └── memory/         # Conversation persistence
├── design-system/      # Design tokens and base components
└── services/           # API integration services
```

### Design System Integration
- **Tokens**: Centralized design tokens in `design-system/tokens.ts`
- **Base Components**: Reusable components in `design-system/components/base/`
- **RTL Support**: Built-in right-to-left text support for Hebrew
- **Responsive**: Mobile-first responsive design

## 🗄️ Backend Architecture

### Service Layer Pattern
```
app/
├── api/                # API route handlers
├── services/           # Business logic services
├── crud/               # Database operations
├── models/             # Database models and schemas
├── core/               # Configuration and utilities
└── websocket/          # WebSocket handlers
```

### Key Services

**Hebrew Processing Services**
- `hebrew_parser_service.py`: Parse Hebrew exercise commands
- `hebrew_exercise_parser.py`: Extract exercise data from Hebrew text
- `hebrew_response_filter.py`: Format AI responses for Hebrew users

**Core Business Services**
- `gamification_service.py`: Points calculation and achievements
- `exercise_integration_service.py`: Exercise data management
- `user_context_manager.py`: User session and context management
- `consistency_service.py`: Workout consistency tracking

## 🔐 Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Secure token-based authentication
- **Session Management**: Redis-based session storage
- **CORS Configuration**: Properly configured for development ports
- **Input Validation**: Comprehensive validation with Pydantic schemas

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **API Rate Limiting**: Prevent abuse and ensure stability
- **Input Sanitization**: Prevent injection attacks
- **Secure Headers**: Security headers configured on FastAPI

## 🚀 Deployment Architecture

### Development Environment
- **Local Development**: All services run locally with Docker databases
- **Hot Reload**: FastAPI and Vite support automatic reloading
- **Debug Mode**: Comprehensive logging and debugging tools
- **Port Management**: Standardized ports 8000-8020

### Production Considerations
- **Database Backups**: Automated backup strategies
- **Monitoring**: Health checks and performance metrics
- **Scaling**: Horizontal scaling ready with stateless design
- **CI/CD**: Automated testing and deployment pipelines

## 📊 Performance Architecture

### Optimization Strategies
- **Async Operations**: Full async/await for I/O operations
- **Connection Pooling**: Database connection pooling
- **Caching**: Redis caching for frequently accessed data
- **Lazy Loading**: Frontend code splitting and lazy loading

### Monitoring & Health
- **Health Endpoints**: `/health` and `/health/detailed`
- **Performance Metrics**: Request latency and throughput
- **Error Tracking**: Comprehensive error logging
- **Database Monitoring**: Query performance tracking

## 🌍 Internationalization Architecture

### Hebrew Language Support
- **UTF-8 Encoding**: Full Unicode support throughout
- **RTL Text Flow**: Right-to-left text rendering
- **Hebrew Exercise Database**: Comprehensive Hebrew exercise names
- **Cultural Adaptation**: Israeli fitness culture and preferences

### Multi-language Design
- **Language Detection**: Automatic language detection from user input
- **Bilingual Responses**: AI can respond in Hebrew or English
- **Localized UI**: Interface adapts to user language preference
- **Exercise Names**: Support for both Hebrew and English exercise names

---

## 🔮 Future Architecture Plans

### Scalability Enhancements
- **Microservices**: Potential split into microservices for scale
- **Event-Driven Architecture**: Add message queues for async processing
- **GraphQL API**: Consider GraphQL for efficient data fetching
- **CDN Integration**: Static asset delivery via CDN

### AI Enhancements
- **Local Model Support**: Integration with local AI models
- **Voice Processing**: Hebrew speech-to-text and text-to-speech
- **Advanced Analytics**: ML-based workout recommendations
- **Computer Vision**: Exercise form analysis via camera

### Mobile Architecture
- **Progressive Web App**: PWA capabilities for mobile experience
- **Native App**: Potential React Native mobile application
- **Offline Support**: Offline workout logging and sync
- **Push Notifications**: Real-time workout reminders and motivation

---

This architecture is designed to be modular, scalable, and maintainable while providing an excellent user experience for Hebrew-speaking fitness enthusiasts.