import 'reflect-metadata';
import Fastify from 'fastify';
import { AppDataSource } from './config/database';
import { connectMongoDB, disconnectMongoDB, getMongoDb } from './config/mongodb';
import { connectRedis, disconnectRedis, getRedisClient } from './config/redis';
import { serverConfig } from './config/server';
import authRoutes from './routes/auth';
import exerciseRoutes from './routes/exercises';
import workoutRoutes from './routes/workouts';
import statsRoutes from './routes/statistics';
import aiRoutes from './routes/ai';
import memoryRoutes from './routes/memory';

async function buildServer() {
  const server = Fastify({
    logger: true,
    trustProxy: true,
  });

  // Register plugins
  await server.register(import('@fastify/cors'), {
    origin: serverConfig.cors.origin,
    credentials: serverConfig.cors.credentials,
  });

  await server.register(import('@fastify/jwt'), {
    secret: serverConfig.jwt.secret,
  });

  await server.register(import('@fastify/cookie'));
  await server.register(import('@fastify/multipart'));
  await server.register(import('@fastify/websocket'));

  // Health check endpoints
  server.get('/health', async () => {
    return {
      status: 'healthy',
      service: 'sweatbot-api',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: serverConfig.nodeEnv,
    };
  });

  server.get('/health/detailed', async () => {
    try {
      // Test PostgreSQL connection
      await AppDataSource.query('SELECT 1');

      // Test MongoDB connection
      let mongodbStatus = 'disconnected';
      try {
        const db = getMongoDb();
        await db.admin().ping();
        mongodbStatus = 'connected';
      } catch (e) {
        mongodbStatus = 'error';
      }

      // Test Redis connection
      let redisStatus = 'disconnected';
      try {
        const redis = getRedisClient();
        await redis.ping();
        redisStatus = 'connected';
      } catch (e) {
        redisStatus = 'error';
      }

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        components: {
          postgresql: {
            status: 'healthy',
            connection: 'established'
          },
          mongodb: {
            status: mongodbStatus
          },
          redis: {
            status: redisStatus
          },
          server: {
            status: 'healthy',
            uptime: process.uptime()
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  });

  // Root endpoint
  server.get('/', async () => {
    return {
      message: 'SweatBot API - TypeScript Backend',
      version: '1.0.0',
      features: [
        'Hebrew fitness tracking',
        'Exercise logging with points',
        'Local AI model support (Ollama)',
        'Real-time updates (WebSocket)',
        'Personal records tracking'
      ],
      supportedLanguages: ['he', 'en'],
      debugMode: serverConfig.nodeEnv === 'development'
    };
  });

  // Register API routes
  await server.register(authRoutes, { prefix: '/auth' });
  await server.register(exerciseRoutes, { prefix: '/exercises' });
  await server.register(workoutRoutes, { prefix: '/workouts' });
  await server.register(statsRoutes, { prefix: '/statistics' });
  await server.register(aiRoutes, { prefix: '/ai' });
  await server.register(memoryRoutes, { prefix: '/api/memory' });

  // WebSocket endpoint for real-time AI streaming
  server.get('/ws', { websocket: true }, (connection, request) => {
    server.log.info(`WebSocket connection established from ${request.socket.remoteAddress}`);

    connection.socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        server.log.info(`Received message: ${data.type || 'unknown'}`);

        // Echo back for now (AI streaming will be implemented later)
        connection.socket.send(JSON.stringify({
          type: 'response',
          content: `Received: ${data.content || data.message || 'unknown'}`,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        server.log.error({error}, 'WebSocket message error');
        connection.socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    connection.socket.on('close', () => {
      server.log.info('WebSocket connection closed');
    });

    connection.socket.on('error', (error: Error) => {
      server.log.error({error}, 'WebSocket error');
    });
  });

  // Error handler
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation
      });
    }

    return reply.status(500).send({
      error: 'Internal Server Error',
      message: serverConfig.nodeEnv === 'development' ? error.message : 'Something went wrong'
    });
  });

  // 404 handler
  server.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: 'The requested resource was not found',
      path: request.url
    });
  });

  return server;
}

async function startServer() {
  try {
    // Initialize PostgreSQL connection
    await AppDataSource.initialize();
    console.log('✅ PostgreSQL connected successfully');

    // Initialize MongoDB connection
    await connectMongoDB();
    console.log('✅ MongoDB connected successfully');

    // Initialize Redis connection
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Build and start server
    const server = await buildServer();

    await server.listen({
      port: serverConfig.port,
      host: serverConfig.host
    });

    console.log(`🚀 SweatBot TypeScript Backend is running on ${serverConfig.host}:${serverConfig.port}`);
    console.log(`📊 Health check available at http://${serverConfig.host}:${serverConfig.port}/health`);
    console.log(`🔧 Debug mode: ${serverConfig.nodeEnv === 'development'}`);
    console.log(`📦 Databases: PostgreSQL ✅  MongoDB ✅  Redis ✅`);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  try {
    await AppDataSource.destroy();
    console.log('✅ PostgreSQL connection closed');

    await disconnectMongoDB();
    console.log('✅ MongoDB connection closed');

    await disconnectRedis();
    console.log('✅ Redis connection closed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start the server
if (require.main === module) {
  startServer();
}

export { buildServer, startServer };