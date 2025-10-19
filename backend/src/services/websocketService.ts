import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export interface AuthenticatedSocket extends Socket {
  userId: string;
  sessionId: string;
  userInfo?: any;
}

export interface WebSocketMessage {
  type: 'chat' | 'typing' | 'status' | 'error';
  data: any;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
  private JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';

  public initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? ['https://sweat-bot.onrender.com']
          : ['http://localhost:8005', 'http://localhost:3000', 'http://localhost:8010'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket: any, next: any) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, this.JWT_SECRET) as any;
        socket.userId = decoded.userId;
        socket.sessionId = decoded.sessionId;

        logger.info('WebSocket user authenticated', {
          userId: decoded.userId,
          sessionId: decoded.sessionId,
          socketId: socket.id,
        });

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    logger.info('WebSocket server initialized');
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const { userId, sessionId } = socket;

    logger.info('WebSocket client connected', {
      userId,
      sessionId,
      socketId: socket.id,
    });

    // Track user connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Join user-specific room
    socket.join(`user:${userId}`);
    socket.join(`session:${sessionId}`);

    // Send welcome message
    socket.emit('connected', {
      type: 'status',
      data: {
        message: 'Connected to SweatBot real-time server',
        userId,
        sessionId,
        socketId: socket.id,
        connectedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    } as WebSocketMessage);

    // Handle chat messages
    socket.on('chat_message', async (data: any) => {
      try {
        logger.info('WebSocket chat message received', {
          userId,
          sessionId,
          messageLength: data.message?.length || 0,
        });

        // Broadcast to user's other sessions
        socket.to(`user:${userId}`).emit('chat_message', {
          type: 'chat',
          data: {
            ...data,
            fromSelf: false,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
          userId,
          sessionId,
        } as WebSocketMessage);

        // Echo back to sender
        socket.emit('chat_message', {
          type: 'chat',
          data: {
            ...data,
            fromSelf: true,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
          userId,
          sessionId,
        } as WebSocketMessage);

      } catch (error) {
        logger.error('Error handling chat message:', error);
        socket.emit('error', {
          type: 'error',
          data: {
            message: 'Failed to process chat message',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          timestamp: new Date().toISOString(),
        } as WebSocketMessage);
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: any) => {
      socket.to(`user:${userId}`).emit('user_typing', {
        type: 'typing',
        data: {
          isTyping: true,
          userId,
          ...data,
        },
        timestamp: new Date().toISOString(),
      } as WebSocketMessage);
    });

    socket.on('typing_stop', (data: any) => {
      socket.to(`user:${userId}`).emit('user_typing', {
        type: 'typing',
        data: {
          isTyping: false,
          userId,
          ...data,
        },
        timestamp: new Date().toISOString(),
      } as WebSocketMessage);
    });

    // Handle voice recording status
    socket.on('voice_recording_start', (data: any) => {
      socket.to(`user:${userId}`).emit('voice_status', {
        type: 'status',
        data: {
          recording: true,
          userId,
          ...data,
        },
        timestamp: new Date().toISOString(),
      } as WebSocketMessage);
    });

    socket.on('voice_recording_stop', (data: any) => {
      socket.to(`user:${userId}`).emit('voice_status', {
        type: 'status',
        data: {
          recording: false,
          userId,
          ...data,
        },
        timestamp: new Date().toISOString(),
      } as WebSocketMessage);
    });

    // Handle AI response streaming
    socket.on('ai_response_stream', (data: any) => {
      socket.to(`user:${userId}`).emit('ai_response_chunk', {
        type: 'chat',
        data: {
          chunk: data.chunk,
          isComplete: data.isComplete || false,
          ...data,
        },
        timestamp: new Date().toISOString(),
      } as WebSocketMessage);
    });

    // Handle disconnection
    socket.on('disconnect', (reason: string) => {
      logger.info('WebSocket client disconnected', {
        userId,
        sessionId,
        socketId: socket.id,
        reason,
      });

      // Remove from tracking
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }

      // Notify other sessions
      socket.to(`user:${userId}`).emit('user_status', {
        type: 'status',
        data: {
          status: 'disconnected',
          userId,
          reason,
        },
        timestamp: new Date().toISOString(),
      } as WebSocketMessage);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error('WebSocket socket error:', {
        userId,
        sessionId,
        socketId: socket.id,
        error: error.message,
      });
    });
  }

  // Public methods for broadcasting
  public broadcastToUser(userId: string, event: string, data: WebSocketMessage): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  public broadcastToSession(sessionId: string, event: string, data: WebSocketMessage): void {
    if (this.io) {
      this.io.to(`session:${sessionId}`).emit(event, data);
    }
  }

  public broadcastToAll(event: string, data: WebSocketMessage): void {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  // Get connection stats
  public getConnectionStats(): {
    totalConnections: number;
    uniqueUsers: number;
    usersByConnectionCount: { [key: string]: number };
  } {
    const stats = {
      totalConnections: 0,
      uniqueUsers: this.connectedUsers.size,
      usersByConnectionCount: {} as { [key: string]: number },
    };

    for (const [userId, sockets] of this.connectedUsers) {
      const connectionCount = sockets.size;
      stats.totalConnections += connectionCount;
      stats.usersByConnectionCount[connectionCount] = (stats.usersByConnectionCount[connectionCount] || 0) + 1;
    }

    return stats;
  }

  // Health check
  public isHealthy(): boolean {
    return this.io !== null;
  }

  // Graceful shutdown
  public shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (this.io) {
        this.io.close(() => {
          logger.info('WebSocket server shut down');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();