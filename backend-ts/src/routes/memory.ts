import { FastifyPluginAsync } from 'fastify';
import { ApiResponse, AuthenticatedUser } from '../types';
import { authenticate } from '../middleware/auth';

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

// In-memory storage for conversations (TODO: move to MongoDB)
const sessions: Map<string, Session> = new Map();

const memoryRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /api/memory/sessions - Get user's conversation sessions
  fastify.get('/sessions', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;

      // Find all sessions for this user
      const userSessions = Array.from(sessions.values())
        .filter(session => session.userId === userId)
        .map(session => ({
          sessionId: session.sessionId,
          messageCount: session.messages.length,
          lastMessage: session.messages[session.messages.length - 1]?.content || '',
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      return reply.send({
        success: true,
        data: userSessions,
        message: 'Sessions retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
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

      const session = sessions.get(sessionId);

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
  fastify.post<{ Body: { sessionId: string; role: string; content: string } }>('/message', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['sessionId', 'role', 'content'],
        properties: {
          sessionId: { type: 'string' },
          role: { type: 'string', enum: ['user', 'assistant', 'system'] },
          content: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { sessionId, role, content } = request.body;

      let session = sessions.get(sessionId);

      if (!session) {
        // Create new session
        session = {
          sessionId,
          userId,
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        sessions.set(sessionId, session);
      }

      // Verify session ownership
      if (session.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: 'Access denied',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

      // Add message to session
      const message: ConversationMessage = {
        role: role as 'user' | 'assistant' | 'system',
        content,
        timestamp: new Date().toISOString()
      };

      session.messages.push(message);
      session.updatedAt = new Date().toISOString();

      return reply.status(201).send({
        success: true,
        data: {
          sessionId,
          messageCount: session.messages.length
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

      const session = sessions.get(sessionId);

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

      sessions.delete(sessionId);

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
