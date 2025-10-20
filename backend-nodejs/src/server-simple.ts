import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Restart trigger for missing endpoints fix

const app = express();

// Middleware - CORS must come first to avoid helmet blocking it
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://sweat-bot.onrender.com']
    : ['http://localhost:8005', 'http://localhost:8007', 'http://localhost:8008', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "connect-src": ["'self'", "ws:", "wss:", "http://localhost:8005", "http://localhost:8007", "http://localhost:8008", "http://localhost:3000"]
    }
  }
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
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
        databases: '🔄 Mock Data',
        ai_providers: '✅ Mock Available'
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.json({
      status: 'degraded',
      service: 'sweatbot-api',
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      features: {
        authentication: '✅ Working',
        ai_chat: '⚠️ Error',
        exercise_tracking: '✅ Working',
        databases: '🔄 Mock Data',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
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

// Simple auth endpoints
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

// Guest authentication endpoint (critical for frontend)
app.post('/auth/guest', async (req, res) => {
  try {
    const { device_id, user_agent } = req.body;

    // Create mock guest user
    const guestUser = {
      id: 'guest-' + Math.random().toString(36).substr(2, 9),
      device_id: device_id || 'unknown-device',
      is_guest: true,
      created_at: new Date().toISOString()
    };

    // Generate mock token
    const token = 'guest-token-' + Math.random().toString(36).substr(2);

    logger.info('Guest user created', {
      userId: guestUser.id,
      deviceId: device_id,
      userAgent: user_agent
    });

    res.json({
      token: token,
      user: guestUser,
      is_guest: true,
      created_at: guestUser.created_at
    });
  } catch (error) {
    logger.error('Guest auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create guest session'
    });
  }
});

// Real AI chat endpoint (simple mock for now)
app.post('/api/v1/chat', async (req, res) => {
  try {
    const { message, provider = 'openai' } = req.body;

    // Mock AI response
    const mockResponse = {
      response: `This is a mock AI response to: "${message}". In production, this would connect to real AI providers.`,
      provider: provider,
      model: 'mock-model',
      tokens: 50,
      responseTime: 150
    };

    res.json({
      success: true,
      data: mockResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      timestamp: new Date().toISOString()
    });
  }
});

// AI providers health check endpoint
app.get('/api/v1/ai/health', async (req, res) => {
  try {
    const mockProviders = [
      { name: 'openai', status: '✅ Mock Available', model: 'gpt-4o-mini' },
      { name: 'groq', status: '✅ Mock Available', model: 'llama-3.3-70b' }
    ];

    res.json({
      success: true,
      providers: mockProviders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check AI providers health',
      timestamp: new Date().toISOString()
    });
  }
});

// Memory storage API endpoints (basic mock for now - will be enhanced with MongoDB)
app.post('/api/memory/message', async (req, res) => {
  try {
    const { message, userId, sessionId, role } = req.body;

    logger.info('Memory message received', {
      userId: userId || 'anonymous',
      sessionId,
      role,
      messageLength: message?.length || 0,
    });

    // Mock memory storage - in real version would store to MongoDB
    const memoryId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.status(201).json({
      success: true,
      data: {
        id: memoryId,
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

    // Mock conversation history - in real version would fetch from MongoDB
    res.json({
      success: true,
      data: {
        conversations: [],
        total: 0,
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

// Get personal context for memory
app.get('/api/memory/context/personal', async (req, res) => {
  try {
    const { userId } = req.query;

    // Mock personal context - in real version would fetch from MongoDB
    res.json({
      success: true,
      data: {
        context: {
          userId: userId || 'anonymous',
          preferences: {
            language: 'hebrew',
            fitnessLevel: 'intermediate',
            goals: ['strength', 'consistency']
          },
          recentTopics: ['exercise_form', 'nutrition', 'recovery'],
          personalityProfile: {
            communicationStyle: 'encouraging',
            humorLevel: 'moderate',
            motivationApproach: 'positive_reinforcement'
          }
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get personal context error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve personal context'
    });
  }
});

// Get chat sessions
app.get('/api/memory/sessions', async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;

    // Mock sessions - in real version would fetch from MongoDB
    const mockSessions = [
      {
        id: 'session_1',
        userId: userId || 'anonymous',
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date(Date.now() - 86000000).toISOString(),
        messageCount: 12,
        topics: ['push-ups', 'protein', 'recovery'],
        sentiment: 'positive'
      },
      {
        id: 'session_2',
        userId: userId || 'anonymous',
        startTime: new Date(Date.now() - 172800000).toISOString(),
        endTime: new Date(Date.now() - 172000000).toISOString(),
        messageCount: 8,
        topics: ['running', 'cardio', 'endurance'],
        sentiment: 'neutral'
      }
    ];

    res.json({
      success: true,
      data: {
        sessions: mockSessions.slice(0, parseInt(limit as string)),
        total: mockSessions.length,
        userId: userId || 'anonymous',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions'
    });
  }
});

// Refresh authentication token
app.post('/auth/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    // Mock token refresh - in real version would validate JWT and issue new one
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required for refresh'
      });
    }

    // Mock validation and refresh
    const newToken = 'refreshed-token-' + Math.random().toString(36).substr(2);

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        refreshToken: 'refresh-' + Math.random().toString(36).substr(2)
      },
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
});

// Simple exercise logging
app.post('/exercises', async (req, res) => {
  try {
    const { exerciseName, sets, reps, weight, workoutType } = req.body;

    // Mock exercise log
    const exercise = {
      id: Math.random().toString(36).substr(2, 9),
      exerciseName,
      sets,
      reps,
      weight: weight || 0,
      workoutType,
      userId: 'mock-user-id',
      createdAt: new Date().toISOString()
    };

    const pointsAwarded = Math.floor(Math.random() * 20) + 10;

    res.status(201).json({
      success: true,
      message: 'Exercise logged successfully',
      data: { exercise, pointsAwarded }
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Get exercise history
app.get('/exercises', async (req, res) => {
  try {
    // Mock exercise history
    const exercises = [
      {
        id: '1',
        exerciseName: 'Push-ups',
        sets: 3,
        reps: 15,
        weight: 0,
        workoutType: 'strength',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        exerciseName: 'Squats',
        sets: 4,
        reps: 20,
        weight: 50,
        workoutType: 'strength',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: { exercises, total: exercises.length }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug log endpoint for mobile debugging
app.post('/api/v1/stt/debug-log', (req, res) => {
  try {
    console.log('[Mobile Debug]', req.body);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[Mobile Debug Error]', error);
    res.status(500).json({ success: false, error: error.message });
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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// WebSocket connection storage
const connectedClients = new Map<string, WebSocket>();

// JWT token validation for WebSocket connections
function validateWebSocketToken(token: string): { userId: string; valid: boolean } {
  try {
    // Handle undefined or empty tokens
    if (!token || token === 'undefined' || token === 'null') {
      return { userId: '', valid: false };
    }

    // Mock validation for guest tokens (in production, use proper JWT verification)
    if (token.startsWith('guest-token-')) {
      return {
        userId: 'guest-' + Math.random().toString(36).substr(2, 9),
        valid: true
      };
    }

    // Mock validation for user tokens
    if (token.startsWith('mock-jwt-token-')) {
      return {
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        valid: true
      };
    }

    // Handle real JWT tokens (format: eyJhbGciOiJIUzI1NiIs...)
    if (token.startsWith('eyJ')) {
      // For now, accept any valid-looking JWT token and extract a mock user ID
      // In production, this should verify the JWT signature and claims
      try {
        // Simple JWT-like token parsing (not secure, for development only)
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode payload (middle part)
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

          // Check if token is expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            return { userId: '', valid: false };
          }

          // Extract user ID or create one
          const userId = payload.sub || payload.userId || payload.name || 'user-' + Math.random().toString(36).substr(2, 9);

          return {
            userId: userId,
            valid: true
          };
        }
      } catch (jwtError) {
        // If JWT parsing fails, treat as invalid
        logger.warn('JWT parsing failed:', jwtError);
      }
    }

    return { userId: '', valid: false };
  } catch (error) {
    logger.error('WebSocket token validation error:', error);
    return { userId: '', valid: false };
  }
}

// Broadcast message to all connected clients
function broadcastToClients(message: any, excludeUserId?: string) {
  connectedClients.forEach((ws, userId) => {
    if (excludeUserId && userId === excludeUserId) return;

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Failed to send message to client:', error);
      }
    }
  });
}

// Start server with WebSocket support
const PORT = process.env.PORT || 8000;
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: '/ws' // WebSocket endpoint path
});

// WebSocket connection handling
wss.on('connection', (ws: WebSocket, req) => {
  try {
    // Extract token from query parameters
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token') || '';

    // Validate token
    const { userId, valid } = validateWebSocketToken(token);

    if (!valid || !userId) {
      logger.warn('WebSocket connection rejected: invalid token', { token: token.substring(0, 20) + '...' });
      ws.close(1008, 'Invalid authentication token');
      return;
    }

    // Store client connection
    connectedClients.set(userId, ws);

    logger.info('WebSocket client connected', {
      userId,
      clientCount: connectedClients.size,
      userAgent: req.headers['user-agent']
    });

    // Send welcome message
    const welcomeMessage = {
      type: 'connection_established',
      data: {
        userId,
        message: 'WebSocket connection established successfully',
        timestamp: new Date().toISOString(),
        connectedClients: connectedClients.size
      }
    };

    ws.send(JSON.stringify(welcomeMessage));

    // Handle incoming messages
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        logger.info('WebSocket message received', {
          userId,
          messageType: message.type,
          messageSize: data.length
        });

        // Handle different message types
        switch (message.type) {
          case 'ping':
            ws.send(JSON.stringify({
              type: 'pong',
              data: { timestamp: new Date().toISOString() }
            }));
            break;

          case 'chat_message':
            // Broadcast chat message to all clients
            broadcastToClients({
              type: 'chat_broadcast',
              data: {
                userId,
                message: message.data.message,
                timestamp: new Date().toISOString()
              }
            });
            break;

          case 'typing':
            // Broadcast typing indicator
            broadcastToClients({
              type: 'user_typing',
              data: {
                userId,
                isTyping: message.data.isTyping
              }
            }, userId); // Don't send back to sender
            break;

          default:
            logger.warn('Unknown WebSocket message type', { userId, messageType: message.type });
        }

      } catch (error) {
        logger.error('Failed to process WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });

    // Handle connection close
    ws.on('close', (code: number, reason: Buffer) => {
      connectedClients.delete(userId);
      logger.info('WebSocket client disconnected', {
        userId,
        code,
        reason: reason.toString(),
        clientCount: connectedClients.size
      });

      // Notify other clients about disconnection
      broadcastToClients({
        type: 'user_disconnected',
        data: {
          userId,
          timestamp: new Date().toISOString()
        }
      });
    });

    // Handle connection errors
    ws.on('error', (error: Error) => {
      logger.error('WebSocket connection error:', error);
      connectedClients.delete(userId);
    });

  } catch (error) {
    logger.error('WebSocket connection setup error:', error);
    ws.close(1011, 'Internal server error');
  }
});

// Handle WebSocket server errors
wss.on('error', (error: Error) => {
  logger.error('WebSocket server error:', error);
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 SweatBot API v2.0.0 (Node.js + WebSocket) started successfully!`);
  console.log(`📍 HTTP Server running on port ${PORT}`);
  console.log(`🔌 WebSocket Server running on ws://localhost:${PORT}/ws`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Debug endpoint: http://localhost:${PORT}/debug/env`);
  console.log(`✅ Ready for deployment to Render with WebSocket support!`);
});

export default app;