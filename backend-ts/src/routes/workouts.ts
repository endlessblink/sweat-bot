import { FastifyPluginAsync } from 'fastify';
import { ApiResponse, WorkoutResponse, AuthenticatedUser } from '../types';
import { ExerciseService } from '../services/exerciseService';
import { authenticate } from '../middleware/auth';

const workoutRoutes: FastifyPluginAsync = async (fastify) => {
  const exerciseService = new ExerciseService();

  // GET /workouts - Get user's workout history
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { limit = 20 } = request.query as { limit?: number };
      const workouts = await exerciseService.getWorkoutHistory(userId, limit);

      return reply.send({
        success: true,
        data: workouts,
        message: 'Workout history retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<WorkoutResponse[]>);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve workouts',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // GET /workouts/personal-records - Get user's personal records
  fastify.get('/personal-records', {
    preHandler: [authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const records = await exerciseService.getPersonalRecords(userId);

      return reply.send({
        success: true,
        data: records,
        message: 'Personal records retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve personal records',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });
};

export default workoutRoutes;