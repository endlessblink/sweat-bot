# SweatBot Database Schema Documentation

## 🗄️ Database Architecture Overview

SweatBot uses a multi-database architecture, with each database optimized for specific data types and access patterns:

- **PostgreSQL** (Port 8001): Relational data for exercises, users, and structured information
- **MongoDB** (Port 8002): Document storage for conversations and AI context
- **Redis** (Port 8003): Key-value cache for sessions and real-time data

---

## 📊 PostgreSQL Schema (Port 8001)

### Database: `hebrew_fitness`

#### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    language VARCHAR(10) DEFAULT 'he',
    timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem'
);
```

**Purpose**: User authentication and profile management
**Key Fields**:
- `preferences`: User preferences (units, notifications, etc.)
- `language`: User's preferred language (he/en)
- `timezone`: User's timezone for workout scheduling

#### Exercises Table
```sql
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    exercise_name_he VARCHAR(100) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL, -- 'strength', 'cardio', 'flexibility'
    muscle_groups TEXT[], -- Array of muscle groups worked
    amount DECIMAL(10,2), -- Weight, distance, etc.
    unit VARCHAR(20), -- kg, km, minutes, etc.
    repetitions INTEGER,
    sets INTEGER,
    duration_seconds INTEGER,
    calories_estimated INTEGER,
    points_earned INTEGER NOT NULL,
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    notes TEXT,
    workout_session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_exercises_user_id (user_id),
    INDEX idx_exercises_created_at (created_at),
    INDEX idx_exercises_type (exercise_type)
);
```

**Purpose**: Core exercise logging and tracking
**Key Features**:
- **Bilingual Support**: Both English and Hebrew exercise names
- **Flexible Logging**: Supports different exercise types (strength, cardio, etc.)
- **Points System**: Automatic point calculation for gamification
- **Session Tracking**: Links exercises to workout sessions

#### Workout Sessions Table
```sql
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(100),
    session_type VARCHAR(50), -- 'strength', 'cardio', 'mixed', 'custom'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    total_duration_seconds INTEGER,
    total_exercises INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    estimated_calories INTEGER,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 10),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    
    -- Indexes
    INDEX idx_workout_sessions_user_id (user_id),
    INDEX idx_workout_sessions_started_at (started_at)
);
```

**Purpose**: Group exercises into workout sessions
**Key Features**:
- **UUID Identification**: Unique session identifiers
- **Session Types**: Different workout categories
- **Duration Tracking**: Automatic session duration calculation
- **Completion Status**: Track finished vs abandoned workouts

#### User Statistics Table
```sql
CREATE TABLE user_statistics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_points INTEGER DEFAULT 0,
    total_exercises INTEGER DEFAULT 0,
    total_workouts INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_calories_burned INTEGER DEFAULT 0,
    favorite_exercise VARCHAR(100),
    favorite_exercise_he VARCHAR(100),
    current_level VARCHAR(20) DEFAULT 'beginner', -- beginner, intermediate, advanced, expert
    level_progress INTEGER DEFAULT 0, -- Progress to next level (0-100)
    
    -- Monthly statistics
    current_month_points INTEGER DEFAULT 0,
    current_month_exercises INTEGER DEFAULT 0,
    last_month_points INTEGER DEFAULT 0,
    last_month_exercises INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index
    INDEX idx_user_statistics_user_id (user_id)
);
```

**Purpose**: Aggregated user statistics and progress tracking
**Key Features**:
- **Level System**: User progression through fitness levels
- **Streak Tracking**: Daily workout consistency
- **Monthly Progress**: Current vs previous month comparisons
- **Auto-calculated**: Derived from exercise data

#### Goals Table
```sql
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'points', 'exercises', 'streak', 'weight', 'duration'
    target_value DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2) DEFAULT 0,
    unit VARCHAR(20), -- points, exercises, days, kg, minutes
    timeframe VARCHAR(20), -- 'daily', 'weekly', 'monthly'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_goals_user_id (user_id),
    INDEX idx_goals_active (is_active),
    INDEX idx_goals_timeframe (timeframe)
);
```

**Purpose**: User goal setting and tracking
**Goal Types**:
- **Points**: Target point accumulation
- **Exercises**: Number of exercises to complete
- **Streak**: Consecutive workout days
- **Weight**: Weight lifting targets
- **Duration**: Workout duration goals

#### Achievements Table
```sql
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(50) NOT NULL, -- 'points_milestone', 'streak', 'exercise_count', etc.
    achievement_name VARCHAR(100) NOT NULL,
    achievement_name_he VARCHAR(100) NOT NULL,
    description TEXT,
    description_he TEXT,
    icon_name VARCHAR(50),
    points_reward INTEGER DEFAULT 0,
    badge_color VARCHAR(20) DEFAULT 'blue', -- for UI display
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_displayed BOOLEAN DEFAULT true, -- user preference
    
    -- Indexes
    INDEX idx_achievements_user_id (user_id),
    INDEX idx_achievements_type (achievement_type)
);
```

**Purpose**: Gamification achievements and badges
**Achievement Categories**:
- **Points Milestones**: 100, 500, 1000+ points
- **Streak Achievements**: 7, 30, 100+ day streaks
- **Exercise Count**: Total exercises completed
- **Special Events**: Workout consistency, personal records

#### Personal Records Table
```sql
CREATE TABLE personal_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exercise_name VARCHAR(100) NOT NULL,
    exercise_name_he VARCHAR(100) NOT NULL,
    record_type VARCHAR(20) NOT NULL, -- 'weight', 'reps', 'duration', 'distance'
    record_value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    workout_session_id UUID REFERENCES workout_sessions(id),
    notes TEXT,
    
    -- Indexes
    INDEX idx_personal_records_user_id (user_id),
    INDEX idx_personal_records_exercise (exercise_name),
    INDEX idx_personal_records_type (record_type)
);
```

**Purpose**: Track personal bests and records
**Record Types**:
- **Weight**: Heaviest weight lifted for an exercise
- **Reps**: Most repetitions in a single set
- **Duration**: Longest duration for time-based exercises
- **Distance**: Farthest distance for cardio exercises

---

## 📝 MongoDB Schema (Port 8002)

### Database: `sweatbot_conversations`

#### Conversations Collection
```javascript
{
  _id: ObjectId,
  userId: Number,              // References PostgreSQL user.id
  sessionId: String,           // Unique session identifier
  messages: [{
    id: String,                // Unique message ID
    role: String,              // 'user', 'assistant', 'system'
    content: String,           // Message content
    language: String,          // 'he', 'en', 'mixed'
    timestamp: Date,           // When message was sent
    toolUsed: String,          // AI tool that was used (if any)
    toolResult: Object,        // Result of tool execution
    metadata: {
      exerciseData: Object,    // Extracted exercise information
      intent: String,          // User's intent classification
      confidence: Number,      // AI confidence in classification
      contextUsed: Boolean     // Whether conversation context was used
    }
  }],
  context: {
    currentWorkout: {
      isActive: Boolean,
      startTime: Date,
      exercisesLogged: Number,
      currentPoints: Number
    },
    userGoals: [{
      type: String,
      target: Number,
      progress: Number
    }],
    recentExercises: [{
      name: String,
      when: Date,
      impact: String
    }],
    conversationState: {
      lastTopic: String,
      needsFollowup: Boolean,
      pendingActions: Array
    }
  },
  metadata: {
    startedAt: Date,
    lastActivity: Date,
    messageCount: Number,
    averageResponseTime: Number,
    languagePreference: String,
    sessionDuration: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Purpose**: Complete conversation history and AI context
**Key Features**:
- **Full Context**: Maintains conversation context for AI
- **Metadata Tracking**: Response times, language preferences
- **Tool Integration**: Tracks which AI tools were used
- **Session Management**: Groups messages into logical sessions

#### User Context Collection
```javascript
{
  _id: ObjectId,
  userId: Number,              // References PostgreSQL user.id
  preferences: {
    language: String,          // 'he', 'en', 'auto'
    units: String,             // 'metric', 'imperial'
    notifications: {
      reminders: Boolean,
      achievements: Boolean,
      weeklyReports: Boolean
    },
    fitnessLevel: String,      // 'beginner', 'intermediate', 'advanced'
    goals: [String],           // Array of user's fitness goals
    preferredExercises: [String], // User's favorite exercises
    avoidedExercises: [String]  // Exercises user prefers to avoid
  },
  aiProfile: {
    conversationStyle: String, // 'motivational', 'technical', 'friendly'
    responseLength: String,    // 'concise', 'detailed', 'balanced'
    humorLevel: Number,        // 0-10 scale
    formality: String          // 'casual', 'formal', 'mixed'
  },
  learningData: {
    exerciseRecognition: {
      [exerciseName]: {
        recognitionCount: Number,
        variations: [String],   // Different ways user refers to this exercise
        lastUsed: Date
      }
    },
    responseFeedback: [{
      messageId: String,
      userRating: Number,      // 1-5 stars
      wasHelpful: Boolean,
      feedback: String,
      timestamp: Date
    }]
  },
  lastUpdated: Date
}
```

**Purpose**: Persistent user context and personalization
**Key Features**:
- **Personalization**: AI adapts to user preferences
- **Learning**: Improves recognition of user's exercise terminology
- **Feedback Integration**: Learns from user feedback on responses

---

## ⚡ Redis Schema (Port 8003)

### Session Storage
```
Key: session:{sessionId}
Value: {
  userId: Number,
  loginTime: Timestamp,
  lastActivity: Timestamp,
  language: String,
  currentPage: String,
  temporaryData: Object
}
TTL: 24 hours
```

### Real-time User State
```
Key: user_state:{userId}
Value: {
  currentWorkout: {
    isActive: Boolean,
    startTime: Timestamp,
    exercisesCount: Number,
    pointsEarned: Number
  },
  unreadNotifications: Number,
  lastSeen: Timestamp,
  onlineStatus: String
}
TTL: 1 hour
```

### API Rate Limiting
```
Key: rate_limit:{userId}:{endpoint}
Value: Number (request count)
TTL: 60 seconds
```

### Cache Frequently Accessed Data
```
Key: user_stats:{userId}
Value: {
  points: Number,
  level: String,
  streak: Number,
  todayExercises: Number
}
TTL: 5 minutes
```

### WebSocket Connection Management
```
Key: websocket_connections:{userId}
Value: {
  connectionId: String,
  connectedAt: Timestamp,
  lastPing: Timestamp
}
TTL: 30 minutes
```

---

## 🔗 Database Relationships

### Primary Relationships
```
Users (1) → (∞) Exercises
Users (1) → (∞) Workout_Sessions
Users (1) → (1)  User_Statistics
Users (1) → (∞) Goals
Users (1) → (∞) Achievements
Users (1) → (∞) Personal_Records

Workout_Sessions (1) → (∞) Exercises
Personal_Records (∞) → (1) Workout_Sessions
```

### Cross-Database Relationships
```
PostgreSQL users.id → MongoDB userId (conversations, context)
PostgreSQL users.id → Redis user_state:{userId}
```

---

## 🚀 Database Performance Optimizations

### PostgreSQL Indexes
```sql
-- Composite indexes for common queries
CREATE INDEX idx_exercises_user_date ON exercises(user_id, created_at DESC);
CREATE INDEX idx_exercises_type_user ON exercises(exercise_type, user_id);
CREATE INDEX idx_workout_sessions_user_date ON workout_sessions(user_id, started_at DESC);

-- Partial indexes for active data
CREATE INDEX idx_active_goals ON goals(user_id, end_date) WHERE is_active = true;
CREATE INDEX idx_recent_achievements ON achievements(user_id, earned_at DESC) WHERE earned_at > NOW() - INTERVAL '30 days';
```

### MongoDB Indexes
```javascript
// Conversations collection indexes
db.conversations.createIndex({ "userId": 1, "sessionId": 1 })
db.conversations.createIndex({ "userId": 1, "metadata.lastActivity": -1 })
db.conversations.createIndex({ "messages.timestamp": -1 })

// User context collection indexes
db.userContext.createIndex({ "userId": 1 }, { unique: true })
```

### Redis Optimization Strategies
- **Pipeline Operations**: Batch multiple Redis operations
- **Connection Pooling**: Reuse Redis connections
- **Appropriate TTLs**: Balance memory usage and performance
- **Key Naming**: Consistent, descriptive key patterns

---

## 📊 Data Migration and Versioning

### Schema Versioning
- **PostgreSQL**: Use Alembic for migrations
- **MongoDB**: Version documents with `schemaVersion` field
- **Redis**: Version key prefixes for backward compatibility

### Migration Strategy
1. **Backward Compatibility**: New fields are optional with defaults
2. **Data Validation**: Validate data structure on read
3. **Gradual Rollout**: Feature flags for new schema usage
4. **Rollback Planning**: Downgrade scripts for each migration

---

## 🔐 Data Security and Privacy

### Sensitive Data Handling
- **Passwords**: Hashed with bcrypt, never stored in plain text
- **Personal Information**: Encrypted at rest in PostgreSQL
- **Conversation Data**: No PII stored in conversation content
- **Session Data**: Short TTL, automatic cleanup

### Data Retention Policies
- **Conversations**: Retain for 1 year, then archive
- **Exercise Data**: Retain indefinitely (user's fitness history)
- **Session Data**: 24-hour retention
- **Cache Data**: 5-minute to 1-hour retention based on type

---

This multi-database architecture provides optimal performance, scalability, and data integrity while supporting the complex requirements of a modern AI-powered fitness application.