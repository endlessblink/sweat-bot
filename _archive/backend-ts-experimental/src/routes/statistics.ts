import { FastifyPluginAsync } from 'fastify';
import { ApiResponse, StatisticsResponse, AuthenticatedUser } from '../types';
import { ExerciseService } from '../services/exerciseService';
import { authenticate } from '../middleware/auth';

const statisticsRoutes: FastifyPluginAsync = async (fastify) => {
  const exerciseService = new ExerciseService();

  // GET /statistics - Get user's comprehensive statistics
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month', 'year'], default: 'week' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { period = 'week' } = request.query as { period?: 'week' | 'month' | 'year' };

      // Get exercise stats for the period
      const exerciseStats = await exerciseService.getExerciseStats(userId, period);

      // Get recent exercises
      const recentExercises = await exerciseService.getUserExercises(userId, 10);

      // Get personal records
      const personalRecords = await exerciseService.getPersonalRecords(userId);

      return reply.send({
        success: true,
        data: {
          period: exerciseStats.period,
          totalPoints: exerciseStats.totalPoints,
          totalExercises: exerciseStats.totalExercises,
          totalWorkouts: exerciseStats.totalWorkouts,
          recentExercises,
          personalRecords,
          dateRange: exerciseStats.dateRange
        },
        message: 'Statistics retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<StatisticsResponse>);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve statistics',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // GET /statistics/exercise-stats - Get exercise statistics by period
  fastify.get('/exercise-stats', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['week', 'month', 'year'], default: 'week' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { period = 'week' } = request.query as { period?: 'week' | 'month' | 'year' };
      const stats = await exerciseService.getExerciseStats(userId, period);

      return reply.send({
        success: true,
        data: stats,
        message: 'Exercise statistics retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve exercise statistics',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });
};

export default statisticsRoutes;