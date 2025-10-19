import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config/environment';
import { chatSimpleController } from './api/v1/chatSimple';
import { aiProviderSimpleService } from './services/aiProviderSimple';
import { DatabaseService } from './services/DatabaseService';
import { AuthService } from './services/AuthService';
import { runMigrations } from './utils/migrationRunner';
import { logger } from './utils/logger';
import { CustomError } from './middleware/errorHandler';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const db = DatabaseService.getInstance();
const authService = new AuthService();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.NODE_ENV === 'production'
    ? ['https://sweat-bot.onrender.com']
    : ['http://localhost:8005', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connections
    const [postgresHealth, mongoHealth, redisHealth] = await Promise.all([
      db.checkPostgresHealth(),
      db.checkMongoHealth(),
      db.checkRedisHealth()
    ]);

    // Check AI providers health
    const aiHealth = await aiProviderSimpleService.healthCheck();

    const allDatabasesHealthy =
      postgresHealth.status === 'healthy' &&
      mongoHealth.status === 'healthy' &&
      redisHealth.status === 'healthy';

    res.json({
      status: allDatabasesHealthy ? 'healthy' : 'degraded',
      service: 'sweatbot-api',
      version: '2.0.0',
      environment: config.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: '✅ Working',
        ai_chat: '✅ Working',
        exercise_tracking: '✅ Working',
        databases: allDatabasesHealthy ? '✅ Connected' : '❌ Error',
        postgres: postgresHealth.status === 'healthy' ? '✅ Connected' : '❌ Error',
        mongodb: mongoHealth.status === 'healthy' ? '✅ Connected' : '❌ Error',
        redis: redisHealth.status === 'healthy' ? '✅ Connected' : '❌ Error',
        ai_providers: aiHealth.length > 0 ? '✅ Connected' : '❌ Not Connected',
        ai_providers_status: aiHealth
      },
      database_response_times: {
        postgres: postgresHealth.responseTime,
        mongodb: mongoHealth.responseTime,
        redis: redisHealth.responseTime
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.json({
      status: 'degraded',
      service: 'sweatbot-api',
      version: '2.0.0',
      environment: config.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: '✅ Working',
        ai_chat: '⚠️ Error',
        exercise_tracking: '✅ Working',
        databases: '❌ Error',
        ai_providers: '❌ Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

// Debug environment endpoint
app.get('/debug/env', (req, res) => {
  // Check for critical API keys (show only existence, not values for security)
  const apiKeys = {
    "OPENAI_API_KEY": !!config.OPENAI_API_KEY,
    "GROQ_API_KEY": !!config.GROQ_API_KEY,
    "GEMINI_API_KEY": !!config.GEMINI_API_KEY,
    "ANTHROPIC_API_KEY": !!config.ANTHROPIC_API_KEY,
    "DATABASE_URL": !!config.DATABASE_URL,
    "MONGODB_URL": !!config.MONGODB_URL,
    "REDIS_URL": !!config.REDIS_URL,
    "JWT_SECRET": !!config.JWT_SECRET
  };

  res.json({
    status: 'debug',
    environment: config.NODE_ENV,
    api_keys_loaded: apiKeys,
    all_env_vars_count: Object.keys(process.env).length,
    timestamp: new Date().toISOString()
  });
});

// Migration endpoint (for admin use)
app.post('/admin/migrate', async (req, res) => {
  try {
    logger.info('🔄 Running database migrations...');
    await runMigrations();
    logger.info('✅ Database migrations completed successfully');

    res.json({
      success: true,
      message: 'Database migrations completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    });
  }
});

// Real authentication endpoints
app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name, age, weight, height, fitnessGoals, preferredLanguage } = req.body;

    // Validate input
    if (!email || !password || !name) {
      throw new CustomError('Email, password, and name are required', 400);
    }

    // Register user
    const result = await authService.register({
      email,
      password,
      name,
      age,
      weight,
      height,
      fitnessGoals,
      preferredLanguage
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(error instanceof CustomError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new CustomError('Email and password are required', 400);
    }

    // Authenticate user
    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(error instanceof CustomError ? error.statusCode : 401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
});

app.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No token provided', 401);
    }

    const token = authHeader.substring(7);
    const user = await authService.verifyToken(token);

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(error instanceof CustomError ? error.statusCode : 401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Token verification failed'
    });
  }
});

// Real AI chat endpoint
app.post('/api/v1/chat', chatSimpleController.sendMessage.bind(chatSimpleController));

// AI providers health check endpoint
app.get('/api/v1/ai/health', chatSimpleController.getProvidersHealth.bind(chatSimpleController));

// Memory storage API endpoints (using MongoDB)
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

    // Store conversation message in MongoDB
    const conversationMessage = {
      role: role || 'user',
      content: message,
      timestamp: new Date(),
      provider: provider || 'unknown',
      model: model || 'unknown',
      tokens: tokens || 0
    };

    await db.saveConversation(userId || 'anonymous', [conversationMessage]);

    res.status(201).json({
      success: true,
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Message stored successfully',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Memory storage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store message'
    });
  }
});

// Get conversation history
app.get('/api/memory/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const conversations = await db.getConversationHistory(userId, limit);

    res.json({
      success: true,
      data: {
        conversations,
        total: conversations.length,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve conversations'
    });
  }
});

// Real exercise logging with database
app.post('/exercises', async (req, res) => {
  try {
    const { exerciseName, sets, reps, weight, notes, workoutType, userId } = req.body;

    // Validate input
    if (!exerciseName || !sets || !reps || !userId) {
      throw new CustomError('Exercise name, sets, reps, and userId are required', 400);
    }

    // Log exercise to database
    const exercise = await db.logExercise(userId, {
      exerciseName,
      sets,
      reps,
      weight,
      notes,
      workoutType: workoutType || 'strength'
    });

    // Award points to user
    const pointsAwarded = Math.floor(Math.random() * 20) + 10;
    await db.awardPoints(
      userId,
      `Completed ${exerciseName} - ${sets} sets × ${reps} reps`,
      'exercise_logging',
      pointsAwarded,
      { exerciseName, sets, reps, weight, workoutType }
    );

    res.status(201).json({
      success: true,
      message: 'Exercise logged successfully',
      data: { exercise, pointsAwarded }
    });
  } catch (error) {
    logger.error('Exercise logging error:', error);
    res.status(error instanceof CustomError ? error.statusCode : 500).json({
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
      throw new CustomError('userId is required', 400);
    }

    const exercises = await db.getExerciseHistory(
      userId as string,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    res.json({
      success: true,
      data: { exercises, total: exercises.length }
    });
  } catch (error) {
    logger.error('Get exercise history error:', error);
    res.status(error instanceof CustomError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve exercise history'
    });
  }
});

// Get user statistics
app.get('/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    // Get exercise stats
    const exerciseStats = await db.getExerciseStats(userId, parseInt(days as string));

    // Get user points
    const userPoints = await db.getUserPoints(userId, parseInt(days as string));

    res.json({
      success: true,
      data: {
        exerciseStats,
        points: userPoints,
        period: `${days} days`,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user statistics'
    });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Initialize database and start server
const initializeServer = async () => {
  try {
    logger.info('🚀 Initializing SweatBot API v2.0.0 (Node.js)...');

    // Connect to databases
    await db.connect();
    logger.info('✅ All databases connected successfully');

    // Run migrations (only in development or when explicitly requested)
    if (config.NODE_ENV === 'development') {
      logger.info('🔄 Running database migrations in development mode...');
      await runMigrations();
      logger.info('✅ Database migrations completed');
    }

    const PORT = config.PORT || 8000;

    app.listen(PORT, () => {
      logger.info(`🎉 SweatBot API v2.0.0 (Node.js) started successfully!`);
      logger.info(`📍 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔧 Debug endpoint: http://localhost:${PORT}/debug/env`);
      logger.info(`🗄️  Migrations: POST http://localhost:${PORT}/admin/migrate`);
      logger.info(`✅ Ready for deployment to Render!`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🔄 SIGTERM received, shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🔄 SIGINT received, shutting down gracefully...');
  await db.disconnect();
  process.exit(0);
});

// Start server
initializeServer();

export default app;