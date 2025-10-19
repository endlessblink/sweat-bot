import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { config, corsConfig } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler, notFound, asyncHandler } from './middleware/errorHandler';
import DatabaseService from './services/DatabaseService';

// Import routes
import { authRoutes } from './routes/auth';
import { chatRoutes } from './routes/chat';
import { exerciseRoutes } from './routes/exercises';
// import { profileRoutes } from './routes/profile';
// import { aiRoutes } from './routes/ai';
// import { setupWebSocket } from './websocket/socketHandler';

const app = express();
const server = createServer(app);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors(corsConfig));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
app.use('/api/', limiter);

// Health check endpoints
app.get('/health', asyncHandler(async (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sweatbot-api',
    version: '2.0.0',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform
  });
}));

app.get('/health/detailed', asyncHandler(async (req, res) => {
  // Check database connections (will be implemented with DatabaseService)
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '2.0.0',
    components: {
      server: { status: 'healthy' },
      // Add database checks when DatabaseService is implemented
      // postgres: await checkPostgresHealth(),
      // mongodb: await checkMongoHealth(),
      // redis: await checkRedisHealth(),
    }
  };

  res.json(healthStatus);
}));

app.get('/debug/env', asyncHandler(async (req, res) => {
  // Debug endpoint to check environment variables
  const apiKeys = {
    OPENAI_API_KEY: !!config.OPENAI_API_KEY,
    GROQ_API_KEY: !!config.GROQ_API_KEY,
    GEMINI_API_KEY: !!config.GEMINI_API_KEY,
    ANTHROPIC_API_KEY: !!config.ANTHROPIC_API_KEY,
    DATABASE_URL: !!config.DATABASE_URL,
    MONGODB_URL: !!config.MONGODB_URL,
    REDIS_URL: !!config.REDIS_URL,
    JWT_SECRET: !!config.JWT_SECRET,
  };

  res.json({
    status: 'debug',
    environment: config.NODE_ENV,
    api_keys_loaded: apiKeys,
    all_env_vars_count: Object.keys(process.env).length,
    timestamp: new Date().toISOString(),
    node_version: process.version,
    platform: process.platform
  });
}));

// Root endpoint
app.get('/', asyncHandler(async (req, res) => {
  res.json({
    message: 'SweatBot API - Hebrew Fitness AI Tracker v2.0.0',
    version: '2.0.0',
    environment: config.NODE_ENV,
    docs: '/health',
    websocket: '/ws',
    features: [
      'Hebrew fitness coaching',
      'AI-powered workout tracking',
      'Real-time updates',
      'Gamification system',
      'Multi-database support',
      'Node.js/TypeScript backend'
    ],
    supported_languages: ['he', 'en'],
    debug_mode: config.NODE_ENV === 'development'
  });
}));

// API Routes
app.use('/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/exercises', exerciseRoutes);
// app.use('/api/v1/profile', profileRoutes);
// app.use('/api/v1/ai', aiRoutes);

// WebSocket setup (will be added when implemented)
// setupWebSocket(server);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.PORT;

async function startServer() {
  try {
    // Initialize database connections
    const db = DatabaseService.getInstance();
    await db.connect();

    server.listen(PORT, () => {
      logger.info(`🚀 SweatBot API v2.0.0 (Node.js/TypeScript) started successfully!`);
      logger.info(`📍 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔧 Debug endpoint: http://localhost:${PORT}/debug/env`);

      if (config.NODE_ENV === 'development') {
        logger.info(`📚 API docs available at: http://localhost:${PORT}/health`);
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;