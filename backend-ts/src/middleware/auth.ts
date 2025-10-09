import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/authService';
import { AuthenticatedUser } from '../types';

export const authService = new AuthService();

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: 'No token provided',
        message: 'Authentication required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = await authService.verifyToken(token);

    // Get user details
    const user = await authService.getUserById(decoded.userId);

    // Attach user to request object
    request.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    // Continue to the next middleware/route
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid token',
      message: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
}

export async function requireRole(requiredRole: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    const user = request.user as AuthenticatedUser;
    if (user.role !== requiredRole && user.role !== 'admin') {
      return reply.status(403).send({
        success: false,
        error: 'Insufficient permissions',
        message: `This resource requires ${requiredRole} role or higher`
      });
    }
  };
}