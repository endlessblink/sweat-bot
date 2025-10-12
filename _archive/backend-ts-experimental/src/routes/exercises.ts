import { FastifyPluginAsync } from 'fastify';
import { CreateExerciseRequest, ApiResponse, ExerciseResponse, AuthenticatedUser } from '../types';
import { ExerciseService } from '../services/exerciseService';
import { authenticate } from '../middleware/auth';

const exerciseRoutes: FastifyPluginAsync = async (fastify) => {
  const exerciseService = new ExerciseService();

  // Shared handler for logging exercises
  const logExerciseHandler = async (request: any, reply: any) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const body = request.body;

      // Normalize Python backend format to TypeScript format
      const normalizedBody: any = {
        nameEn: body.nameEn || body.name || 'unknown',
        nameHe: body.nameHe || body.name_he,
        type: body.type || body.exercise_type || 'other',
        category: body.category,
        sets: body.sets,
        reps: body.reps,
        weightKg: body.weightKg || body.weight_kg,
        durationMinutes: body.durationMinutes || (body.duration_seconds ? body.duration_seconds / 60 : undefined),
        distanceKm: body.distanceKm || body.distance_km,
        calories: body.calories,
        intensity: body.intensity,
        notes: body.notes,
        points: body.points_earned || body.points
      };

      const result = await exerciseService.logExercise(userId, normalizedBody);

      return reply.status(201).send({
        success: true,
        data: result,
        message: 'Exercise logged successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<ExerciseResponse>);
    } catch (error) {
      return reply.status(400).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to log exercise',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  };

  const exerciseSchema = {
    body: {
      type: 'object',
      // Accept either Python format (name) or TypeScript format (nameEn)
      anyOf: [
        { required: ['name'] },
        { required: ['nameEn'] }
      ],
      properties: {
        // Support both naming conventions
        name: { type: 'string', minLength: 1 },
        nameEn: { type: 'string', minLength: 1 },
        name_he: { type: 'string' },
        nameHe: { type: 'string' },
        exercise_type: { type: 'string' },
        type: {
          type: 'string',
          enum: ['strength', 'cardio', 'flexibility', 'balance', 'sports', 'other']
        },
        category: { type: 'string' },
        sets: { type: 'integer', minimum: 1 },
        reps: { type: 'integer', minimum: 1 },
        weight_kg: { type: 'number', minimum: 0 },
        weightKg: { type: 'number', minimum: 0 },
        duration_seconds: { type: 'number', minimum: 0 },
        durationMinutes: { type: 'number', minimum: 0 },
        distance_km: { type: 'number', minimum: 0 },
        distanceKm: { type: 'number', minimum: 0 },
        points_earned: { type: 'number', minimum: 0 },
        calories: { type: 'integer', minimum: 0 },
        intensity: {
          type: 'string',
          enum: ['low', 'medium', 'high']
        },
        notes: { type: 'string', maxLength: 500 },
        timestamp: { type: 'string' }
      }
    }
  };

  // POST /exercises - Log a new exercise (primary endpoint)
  fastify.post<{ Body: CreateExerciseRequest; Reply: ApiResponse<ExerciseResponse> }>('/', {
    preHandler: [authenticate],
    schema: exerciseSchema
  }, logExerciseHandler);

  // POST /exercises/log - Log a new exercise (alias for backward compatibility)
  fastify.post<{ Body: CreateExerciseRequest; Reply: ApiResponse<ExerciseResponse> }>('/log', {
    preHandler: [authenticate],
    schema: exerciseSchema
  }, logExerciseHandler);

  // GET /exercises - Get user's exercise history
  fastify.get('/', {
    preHandler: [authenticate],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { limit = 50 } = request.query as { limit?: number };
      const exercises = await exerciseService.getUserExercises(userId, limit);

      return reply.send({
        success: true,
        data: exercises,
        message: 'Exercise history retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse<ExerciseResponse[]>);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve exercises',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // DELETE /exercises/:id - Delete an exercise
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request.user as AuthenticatedUser).id;
      const { id } = request.params;
      await exerciseService.deleteExercise(id, userId);

      return reply.send({
        success: true,
        message: 'Exercise deleted successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
      return reply.status(statusCode).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete exercise',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });
};

export default exerciseRoutes;