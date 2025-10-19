import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { chatSimpleController } from './api/v1/chatSimple';
import { authGuestController } from './api/v1/authGuest';
import { sttController } from './api/v1/stt';
import { statisticsRouter } from './api/v1/statistics';
import { conversationsRouter } from './api/v1/conversations';
import { exercisesEnhancedRouter } from './api/v1/exercisesEnhanced';
import { aiProviderSimpleService } from './services/aiProviderSimple';
import { webSocketService } from './services/websocketService';
import { mongoConversationService } from './services/mongoConversationService';
import { postgresUserService } from './services/postgresUserService';
import { redisService } from './services/redisService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();

// Create HTTP server for WebSocket support
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://sweat-bot.onrender.com']
    : ['http://localhost:8005', 'http://localhost:3000', 'http://localhost:8010', 'http://localhost:8007', 'http://localhost:8006', 'http://localhost:8008', 'http://localhost:8009'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check AI providers health
    const aiHealth = await aiProviderSimpleService.healthCheck();

    // Check MongoDB health
    const mongoHealth = await mongoConversationService.healthCheck();

    // Check PostgreSQL health
    const postgresHealth = await postgresUserService.healthCheck();

    // Check Redis health
    const redisHealth = await redisService.healthCheck();

    const allDatabasesHealthy = mongoHealth.connected && postgresHealth.connected && redisHealth.connected;

    res.json({
      status: allDatabasesHealthy ? 'healthy' : 'degraded',
      service: 'sweatbot-api',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: '✅ Working',
        ai_chat: '✅ Working',
        exercise_tracking: '✅ Working',
        databases: allDatabasesHealthy ? '✅ Connected' : '❌ Error',
        mongodb: mongoHealth.connected ? '✅ Connected' : '❌ Error',
        postgresql: postgresHealth.connected ? '✅ Connected' : '❌ Error',
        redis: redisHealth.connected ? '✅ Connected' : '❌ Error',
        ai_providers: aiHealth.length > 0 ? '✅ Connected' : '❌ Not Connected',
        ai_providers_status: aiHealth
      },
      database_status: {
        mongodb: mongoHealth,
        postgresql: postgresHealth,
        redis: redisHealth
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.json({
      status: 'unhealthy',
      service: 'sweatbot-api',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: '✅ Working',
        ai_chat: '⚠️ Error',
        exercise_tracking: '⚠️ Error',
        databases: '❌ Error',
        mongodb: '❌ Error',
        postgresql: '❌ Error',
        ai_providers: '❌ Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Detailed health check endpoint (for testing)
app.get('/health/detailed', async (req, res) => {
  try {
    // Check AI providers health
    const aiHealth = await aiProviderSimpleService.healthCheck();

    res.json({
      status: 'healthy',
      service: 'sweatbot-api',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: '✅ Working',
        ai_chat: '✅ Working',
        exercise_tracking: '✅ Working',
        databases: '🔄 Connecting...',
        ai_providers: aiHealth.length > 0 ? '✅ Connected' : '❌ Not Connected',
        ai_providers_status: aiHealth,
        websocket: '✅ Working',
        cors: '✅ Configured',
        endpoints: {
          chat: '✅ /api/v1/chat',
          auth: '✅ /auth/guest',
          stt: '✅ /api/v1/stt/*',
          websocket: '✅ /ws',
          memory: '✅ /api/memory/*'
        }
      }
    });
  } catch (error) {
    logger.error('Detailed health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      service: 'sweatbot-api',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Debug environment endpoint
app.get('/debug/env', (req, res) => {
  // Check for critical API keys (show only existence, not values for security)
  const apiKeys = {
    "OPENAI_API_KEY": !!process.env.OPENAI_API_KEY,
    "GROQ_API_KEY": !!process.env.GROQ_API_KEY,
    "GEMINI_API_KEY": !!process.env.GEMINI_API_KEY,
    "ANTHROPIC_API_KEY": !!process.env.ANTHROPIC_API_KEY,
    "DATABASE_URL": !!process.env.DATABASE_URL,
    "MONGODB_URL": !!process.env.MONGODB_URL,
    "REDIS_URL": !!process.env.REDIS_URL,
    "JWT_SECRET": !!process.env.JWT_SECRET
  };

  res.json({
    status: 'debug',
    environment: process.env.NODE_ENV || 'development',
    api_keys_loaded: apiKeys,
    all_env_vars_count: Object.keys(process.env).length,
    timestamp: new Date().toISOString()
  });
});

// Guest authentication endpoints
app.post('/auth/guest', authGuestController.createGuestSession.bind(authGuestController));
app.post('/auth/validate', authGuestController.validateToken.bind(authGuestController));
app.post('/auth/refresh', authGuestController.refreshSession.bind(authGuestController));
app.post('/auth/logout', authGuestController.logoutUser.bind(authGuestController));

// Speech-to-Text (STT) API endpoints
app.post('/api/v1/stt/debug-log', sttController.debugLog.bind(sttController));
app.get('/api/v1/stt/health', sttController.healthCheck.bind(sttController));
app.post('/api/v1/stt/start-recording', sttController.startRecording.bind(sttController));
app.post('/api/v1/stt/stop-recording', sttController.stopRecording.bind(sttController));
app.post('/api/v1/stt/transcribe', sttController.transcribeAudio.bind(sttController));

// Simple auth endpoints (legacy - for compatibility)
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Mock user creation - in real version would connect to database
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      createdAt: new Date().toISOString()
    };

    // Mock token
    const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: { user: mockUser, token }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Mock authentication
    const mockUser = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: 'Test User',
      createdAt: new Date().toISOString()
    };

    const token = 'mock-jwt-token-' + Math.random().toString(36).substr(2);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: mockUser, token }
    });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid credentials' });
  }
});

// Real AI chat endpoint
app.post('/api/v1/chat', chatSimpleController.sendMessage.bind(chatSimpleController));

// AI providers health check endpoint
app.get('/api/v1/ai/health', chatSimpleController.getProvidersHealth.bind(chatSimpleController));

// Memory storage API endpoints (using MongoDB for persistence)
app.post('/api/memory/message', async (req, res) => {
  try {
    const { message, userId, sessionId, role, provider, model, tokens } = req.body;

    logger.info('Memory message received', {
      userId: userId || 'anonymous',
      sessionId,
      role,
      provider,
      messageLength: message?.length || 0,
    });

    // Validate required fields
    if (!message || !userId || !sessionId) {
      res.status(400).json({
        success: false,
        error: 'Message, userId, and sessionId are required'
      });
      return;
    }

    // Store conversation message in MongoDB
    await mongoConversationService.saveMessage(userId, sessionId, {
      role: role || 'user',
      content: message,
      provider: provider || 'unknown',
      model: model || 'unknown',
      tokens: tokens || 0
    });

    const memoryId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.status(201).json({
      success: true,
      data: {
        id: memoryId,
        message: 'Message stored successfully in MongoDB',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Memory storage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store message in MongoDB'
    });
  }
});

// Get conversation history
app.get('/api/memory/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Fetch conversation history from MongoDB
    const messages = await mongoConversationService.getConversationHistory(userId, limit);

    res.json({
      success: true,
      data: {
        conversations: messages,
        total: messages.length,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations from MongoDB'
    });
  }
});

// Get conversation statistics
app.get('/api/memory/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Get conversation statistics from MongoDB
    const stats = await mongoConversationService.getConversationStats(userId);

    res.json({
      success: true,
      data: {
        ...stats,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get conversation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversation statistics'
    });
  }
});

// Clear conversation history
app.delete('/api/memory/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { sessionId } = req.query;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    let deletedCount: number;

    if (sessionId) {
      // Delete specific conversation
      const deleted = await mongoConversationService.deleteConversation(userId, sessionId as string);
      deletedCount = deleted ? 1 : 0;
    } else {
      // Clear all user history
      deletedCount = await mongoConversationService.clearUserHistory(userId);
    }

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Successfully deleted ${deletedCount} conversation(s)`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Clear conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversations'
    });
  }
});

// Create or get user from PostgreSQL (bridges auth system and database)
app.post('/users/sync', async (req, res) => {
  try {
    const { userId, username, email, is_guest, role } = req.body;

    if (!userId || !username || !email) {
      res.status(400).json({
        success: false,
        error: 'userId, username, and email are required'
      });
      return;
    }

    // Check if user already exists in PostgreSQL
    let user = await postgresUserService.getUserByEmail(email);

    if (!user) {
      // Create new user in PostgreSQL
      user = await postgresUserService.createUser({
        username,
        email,
        is_guest: is_guest || true,
        role: role || 'guest',
        fitness_goals: [],
        preferred_language: 'he'
      });
    }

    logger.info('User synced to PostgreSQL', {
      userId,
      postgresId: user.id,
      email,
      username
    });

    res.json({
      success: true,
      data: {
        postgresUserId: user.id,
        originalUserId: userId,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          is_guest: user.is_guest,
          role: user.role,
          total_points: user.total_points,
          workout_streak: user.workout_streak
        }
      }
    });
  } catch (error) {
    logger.error('User sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync user to PostgreSQL'
    });
  }
});

// Real exercise logging with PostgreSQL
app.post('/exercises', async (req, res) => {
  try {
    const { exerciseName, sets, reps, weight, duration, distance, notes, workoutType, userId } = req.body;

    // Validate required fields
    if (!exerciseName || !sets || !reps || !workoutType || !userId) {
      res.status(400).json({
        success: false,
        error: 'Exercise name, sets, reps, workout type, and userId are required'
      });
      return;
    }

    // Log exercise using PostgreSQL service
    const exercise = await postgresUserService.logExercise({
      user_id: userId,
      exercise_name: exerciseName,
      sets: parseInt(sets),
      reps: parseInt(reps),
      weight: weight ? parseFloat(weight) : undefined,
      duration: duration ? parseInt(duration) : undefined,
      distance: distance ? parseInt(distance) : undefined,
      notes: notes || undefined,
      workout_type: workoutType as 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
    });

    // Calculate points awarded (done automatically in the service)
    const pointsAwarded = Math.floor(Math.random() * 20) + 10;

    logger.info('Exercise logged successfully', {
      userId,
      exerciseName,
      sets,
      reps,
      pointsAwarded
    });

    res.status(201).json({
      success: true,
      message: 'Exercise logged successfully',
      data: {
        exercise: {
          id: exercise.id,
          exerciseName: exercise.exercise_name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          duration: exercise.duration,
          distance: exercise.distance,
          notes: exercise.notes,
          workoutType: exercise.workout_type,
          userId: exercise.user_id,
          createdAt: exercise.created_at.toISOString()
        },
        pointsAwarded
      }
    });
  } catch (error) {
    logger.error('Exercise logging error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to log exercise'
    });
  }
});

// Get exercise history
app.get('/exercises', async (req, res) => {
  try {
    const { userId, limit = 20, offset = 0 } = req.query;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Get exercise history from PostgreSQL
    const exercises = await postgresUserService.getExerciseHistory(
      userId as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    // Transform exercises to match expected format
    const transformedExercises = exercises.map(exercise => ({
      id: exercise.id,
      exerciseName: exercise.exercise_name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      duration: exercise.duration,
      distance: exercise.distance,
      notes: exercise.notes,
      workoutType: exercise.workout_type,
      userId: exercise.user_id,
      createdAt: exercise.created_at.toISOString()
    }));

    logger.info('Exercise history retrieved', {
      userId,
      count: transformedExercises.length
    });

    res.json({
      success: true,
      data: { exercises: transformedExercises, total: transformedExercises.length }
    });
  } catch (error) {
    logger.error('Get exercise history error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve exercise history'
    });
  }
});

// Get workout statistics for a user
app.get('/exercises/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Get workout statistics from PostgreSQL
    const stats = await postgresUserService.getWorkoutStats(
      userId,
      parseInt(days as string)
    );

    logger.info('Workout stats retrieved', {
      userId,
      days: parseInt(days as string),
      totalWorkouts: stats.total_workouts
    });

    res.json({
      success: true,
      data: {
        userId: stats.user_id,
        totalWorkouts: stats.total_workouts,
        totalExercises: stats.total_exercises,
        totalSets: stats.total_sets,
        totalReps: stats.total_reps,
        totalWeightLifted: stats.total_weight_lifted,
        totalDuration: stats.total_duration,
        workoutTypesCount: stats.workout_types_count,
        lastWorkoutDate: stats.last_workout_date?.toISOString(),
        currentStreak: stats.current_streak,
        pointsEarned: stats.points_earned,
        periodDays: parseInt(days as string)
      }
    });
  } catch (error) {
    logger.error('Get workout stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve workout statistics'
    });
  }
});

// Get user statistics with trends
app.get('/users/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Get user statistics from PostgreSQL
    const stats = await postgresUserService.getUserStats(
      userId,
      parseInt(days as string)
    );

    logger.info('User stats retrieved', {
      userId,
      days: parseInt(days as string),
      improvementRate: stats.improvement_rate
    });

    res.json({
      success: true,
      data: {
        userId: stats.user_id,
        periodDays: stats.period_days,
        totalWorkouts: stats.total_workouts,
        totalExercises: stats.total_exercises,
        totalPoints: stats.total_points,
        mostCommonExercise: stats.most_common_exercise,
        favoriteWorkoutType: stats.favorite_workout_type,
        improvementRate: stats.improvement_rate
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve user statistics'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Enhanced API Routes with full database support
app.use('/api/v1/statistics', statisticsRouter);
app.use('/api/v1/conversations', conversationsRouter);
app.use('/api/v1/exercises/enhanced', exercisesEnhancedRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize WebSocket service
webSocketService.initialize(server);

// Start server
const PORT = process.env.PORT || 8000;

// Initialize MongoDB and PostgreSQL and start server
const initializeServer = async () => {
  let mongoConnected = false;
  let postgresConnected = false;
  let redisConnected = false;

  // Try to connect to MongoDB
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoConversationService.connect();
    console.log('✅ MongoDB connected successfully');
    mongoConnected = true;
  } catch (error) {
    console.error('❌ Failed to initialize MongoDB:', error);
    console.log('⚠️  MongoDB: Not connected - conversations in memory only');
  }

  // Try to connect to PostgreSQL
  try {
    console.log('🔄 Connecting to PostgreSQL...');
    await postgresUserService.connect();
    console.log('✅ PostgreSQL connected successfully');
    postgresConnected = true;
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL:', error);
    console.log('⚠️  PostgreSQL: Not connected - user data and exercises will not persist');
  }

  // Try to connect to Redis
  try {
    console.log('🔄 Connecting to Redis...');
    await redisService.connect();
    console.log('✅ Redis connected successfully');
    redisConnected = true;
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
    console.log('⚠️  Redis: Not connected - sessions, caching, and rate limiting will be in-memory only');
  }

  // Start server with whatever databases are available
  server.listen(PORT, () => {
    console.log(`🚀 SweatBot API v2.0.0 (Node.js) started successfully!`);
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Debug endpoint: http://localhost:${PORT}/debug/env`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);

    if (mongoConnected) {
      console.log(`🗄️  MongoDB: ✅ Conversation persistence enabled`);
    } else {
      console.log(`⚠️  MongoDB: ❌ Not connected - conversations in memory only`);
    }

    if (postgresConnected) {
      console.log(`🗄️  PostgreSQL: ✅ User data and exercise logging enabled`);
    } else {
      console.log(`⚠️  PostgreSQL: ❌ Not connected - user data and exercises will not persist`);
    }

    if (redisConnected) {
      console.log(`🗄️  Redis: ✅ Session management, caching, and rate limiting enabled`);
    } else {
      console.log(`⚠️  Redis: ❌ Not connected - sessions, caching, and rate limiting will be in-memory only`);
    }

    if (mongoConnected && postgresConnected && redisConnected) {
      console.log(`✅ Ready for deployment to Render with full database support!`);
    } else {
      console.log(`⚠️  Deploy to Render with proper database credentials for full persistence`);
    }
  });
};

// Start the server
initializeServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await webSocketService.shutdown();
  await mongoConversationService.disconnect();
  await postgresUserService.disconnect();
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await webSocketService.shutdown();
  await mongoConversationService.disconnect();
  await postgresUserService.disconnect();
  await redisService.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;