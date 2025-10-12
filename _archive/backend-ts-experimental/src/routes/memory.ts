import { FastifyPluginAsync } from 'fastify';
import { ApiResponse, AuthenticatedUser } from '../types';
import { authenticate } from '../middleware/auth';
import { getMongoDb } from '../config/mongodb';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface Session {
  sessionId: string;
  userId: string;
  messages: ConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

const memoryRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /api/memory/sessions - Get user's conversation sessions
  fastify.get('/sessions', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const db = getMongoDb();
      const sessionsCollection = db.collection<Session>('sessions');

      // Find all sessions for this user
      const userSessions = await sessionsCollection
        .find({ userId })
        .sort({ updatedAt: -1 })
        .toArray();

      const formattedSessions = userSessions.map(session => ({
        sessionId: session.sessionId,
        messageCount: session.messages.length,
        lastMessage: session.messages[session.messages.length - 1]?.content || '',
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }));

      return reply.send({
        success: true,
        data: formattedSessions,
        message: 'Sessions retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: true,
        error: error instanceof Error ? error.message : 'Failed to retrieve sessions',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // GET /api/memory/messages/:sessionId - Get messages for a specific session
  fastify.get<{ Params: { sessionId: string } }>('/messages/:sessionId', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { sessionId } = request.params;
      const db = getMongoDb();
      const sessionsCollection = db.collection<Session>('sessions');

      const session = await sessionsCollection.findOne({ sessionId });

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

      if (session.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: session.messages,
        message: 'Messages retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve messages',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /api/memory/message - Store a new message
  fastify.post<{ Body: any }>('/message', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['sessionId', 'message'],
        properties: {
          userId: { type: 'string' },
          sessionId: { type: 'string' },
          message: {
            type: 'object',
            required: ['role', 'content'],
            properties: {
              role: { type: 'string', enum: ['user', 'assistant', 'system'] },
              content: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const body = request.body as any;
      const { sessionId, message: messageData } = body;
      const { role, content } = messageData;
      const db = getMongoDb();
      const sessionsCollection = db.collection<Session>('sessions');

      let session = await sessionsCollection.findOne({ sessionId });
      let messageCount = 0;

      if (!session) {
        // Create new session
        const newSession: Session = {
          sessionId,
          userId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await sessionsCollection.insertOne(newSession);
        messageCount = 0;
      } else {
        // Verify session ownership
        if (session.userId !== userId) {
          return reply.status(403).send({
            success: false,
            error: 'Access denied',
            timestamp: new Date().toISOString()
          } as ApiResponse);
        }
        messageCount = session.messages.length;
      }

      // Add message to session
      const message: ConversationMessage = {
        role: role as 'user' | 'assistant' | 'system',
        content,
        timestamp: new Date().toISOString()
      };

      await sessionsCollection.updateOne(
        { sessionId },
        {
          $push: { messages: message },
          $set: { updatedAt: new Date().toISOString() }
        }
      );

      return reply.status(201).send({
        success: true,
        data: {
          sessionId,
          messageCount: messageCount + 1
        },
        message: 'Message stored successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store message',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // DELETE /api/memory/session/:sessionId - Delete a session
  fastify.delete<{ Params: { sessionId: string } }>('/session/:sessionId', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { sessionId } = request.params;
      const db = getMongoDb();
      const sessionsCollection = db.collection<Session>('sessions');

      const session = await sessionsCollection.findOne({ sessionId });

      if (!session) {
        return reply.status(404).send({
          success: false,
          error: 'Session not found',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

      if (session.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

      await sessionsCollection.deleteOne({ sessionId });

      return reply.send({
        success: true,
        message: 'Session deleted successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete session',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });
};

export default memoryRoutes;
