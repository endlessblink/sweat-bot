import { FastifyPluginAsync } from 'fastify';
import { LoginRequest, CreateUserRequest, AuthResponse, ApiResponse } from '../types';
import { AuthService } from '../services/authService';

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService();

  // POST /auth/register - Register a new user
  fastify.post<{ Body: CreateUserRequest }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          username: { type: 'string', minLength: 3 },
          fullName: { type: 'string' },
          fullNameHe: { type: 'string' },
          age: { type: 'integer', minimum: 13, maximum: 120 },
          weightKg: { type: 'number', minimum: 30, maximum: 300 },
          heightCm: { type: 'number', minimum: 100, maximum: 250 },
          fitnessLevel: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
          preferredLanguage: { type: 'string', enum: ['he', 'en'] }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await authService.register(request.body);

      return reply.status(201).send({
        success: true,
        data: result,
        message: 'User registered successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /auth/login - User login
  fastify.post<{ Body: LoginRequest }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const result = await authService.login(request.body);

      return reply.send({
        success: true,
        data: result,
        message: 'Login successful',
        timestamp: new Date().toISOString()
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      return reply.status(401).send({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /auth/refresh - Refresh JWT token
  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
      try {
        const { token } = request.body as { token: string };
        const decoded = await authService.verifyToken(token);
        const result = await authService.refreshToken(decoded.userId);

        return reply.send({
          success: true,
          data: result,
          message: 'Token refreshed successfully',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      } catch (error) {
        return reply.status(401).send({
          success: false,
          error: error instanceof Error ? error.message : 'Token refresh failed',
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }
  });

  // POST /auth/logout - User logout
  fastify.post('/logout', async (request, reply) => {
    // Logout is typically handled client-side by removing the token
    // We could implement token blacklisting here if needed
    return reply.send({
      success: true,
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  });

  // POST /auth/guest - Guest authentication (creates temporary user)
  fastify.post('/guest', async (request, reply) => {
    try {
      // Create a guest user with temporary credentials
      const guestEmail = `guest_${Date.now()}@sweatbot.local`;
      const guestData: CreateUserRequest = {
        email: guestEmail,
        password: Math.random().toString(36).substring(2, 15),
        username: `guest_${Date.now()}`,
        fitnessLevel: 'beginner',
        preferredLanguage: 'he'
      };

      const result = await authService.register(guestData);

      return reply.status(201).send({
        success: true,
        data: result,
        message: 'Guest user created successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<AuthResponse>);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Guest authentication failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });
};

export default authRoutes;