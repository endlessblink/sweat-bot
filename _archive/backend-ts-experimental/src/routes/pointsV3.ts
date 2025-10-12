/**
 * Points v3 Routes
 * Unified points calculation API using YAML configuration
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { Repository } from 'typeorm';
import { PointsCalculationV3 } from '../entities/PointsCalculationV3';
import { UserAchievementV3 } from '../entities/UserAchievementV3';
import { pointsEngineV3 } from '../services/points/PointsEngineV3';
import { AuthenticatedUser } from '../types';

interface CalculatePointsRequest {
  exercise: string;
  reps?: number;
  sets?: number;
  weightKg?: number;
  distanceKm?: number;
  durationSeconds?: number;
  isPersonalRecord?: boolean;
  exerciseId?: string;
}

interface BulkCalculationRequest {
  exercises: CalculatePointsRequest[];
}

const pointsV3Routes: FastifyPluginAsync = async (fastify) => {
  // Import database connection directly (match existing pattern)
  const { AppDataSource } = await import('../config/database');
  const calculationRepository = AppDataSource.getRepository(PointsCalculationV3);
  const achievementRepository = AppDataSource.getRepository(UserAchievementV3);

  /**
   * POST /api/v3/points/calculate
   * Calculate points for a single exercise
   */
  fastify.post<{ Body: CalculatePointsRequest }>(
    '/calculate',
    {
      schema: {
        body: {
          type: 'object',
          required: ['exercise'],
          properties: {
            exercise: { type: 'string' },
            reps: { type: 'integer', minimum: 0 },
            sets: { type: 'integer', minimum: 1 },
            weightKg: { type: 'number', minimum: 0 },
            distanceKm: { type: 'number', minimum: 0 },
            durationSeconds: { type: 'integer', minimum: 0 },
            isPersonalRecord: { type: 'boolean' },
            exerciseId: { type: 'string' }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: CalculatePointsRequest }>, reply: FastifyReply) => {
      try {
        const { exercise, reps, sets, weightKg, distanceKm, durationSeconds, isPersonalRecord } = request.body;
        const userId = (request.user as AuthenticatedUser)?.id || 'guest';

        // Get user context (simplified for now)
        const userContext = {
          userId,
          totalPoints: 0,
          totalWorkouts: 0,
          streakDays: 0,
          sessionExerciseCount: 0,
          workoutHour: new Date().getHours()
        };

        // Calculate points using unified engine
        const result = await pointsEngineV3.calculatePoints({
          exerciseKey: exercise,
          reps,
          sets,
          weightKg,
          distanceKm,
          durationSeconds,
          isPersonalRecord,
          userContext
        });

        if (result.status === 'failed') {
          return reply.status(400).send({
            success: false,
            errors: result.errors
          });
        }

        // Save calculation to audit trail
        const calculation = calculationRepository.create({
          userId,
          exerciseId: request.body.exerciseId,
          exerciseKey: exercise,
          calculationData: {
            breakdown: result.breakdown,
            input: request.body
          },
          pointsEarned: result.totalPoints,
          rulesApplied: result.appliedRules,
          configurationVersion: 1,
          calculationTimeMs: result.calculationTime
        });

        await calculationRepository.save(calculation);

        return reply.send({
          success: true,
          totalPoints: result.totalPoints,
          exerciseKey: result.exerciseKey,
          exerciseNameHe: result.exerciseNameHe,
          breakdown: {
            basePoints: result.breakdown.basePoints,
            repsPoints: result.breakdown.repsPoints,
            setsPoints: result.breakdown.setsPoints,
            weightPoints: result.breakdown.weightPoints,
            distancePoints: result.breakdown.distancePoints,
            durationPoints: result.breakdown.durationPoints,
            bonusPoints: result.breakdown.bonusPoints,
            multiplier: result.breakdown.multiplierValue,
            total: result.breakdown.totalPoints
          },
          appliedBonuses: result.breakdown.appliedBonuses,
          appliedMultipliers: result.breakdown.appliedMultipliers,
          calculationTimeMs: result.calculationTime,
          calculationId: calculation.id
        });
      } catch (error) {
        console.error('Points calculation error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Calculation failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/v3/points/calculate/bulk
   * Calculate points for multiple exercises
   */
  fastify.post<{ Body: BulkCalculationRequest }>(
    '/calculate/bulk',
    async (request: FastifyRequest<{ Body: BulkCalculationRequest }>, reply: FastifyReply) => {
      try {
        const userId = (request.user as AuthenticatedUser)?.id || 'guest';
        const userContext = {
          userId,
          totalPoints: 0,
          totalWorkouts: 0,
          streakDays: 0,
          sessionExerciseCount: 0,
          workoutHour: new Date().getHours()
        };

        const results = [];
        let totalPoints = 0;

        for (const exerciseData of request.body.exercises) {
          const result = await pointsEngineV3.calculatePoints({
            exerciseKey: exerciseData.exercise,
            reps: exerciseData.reps,
            sets: exerciseData.sets,
            weightKg: exerciseData.weightKg,
            distanceKm: exerciseData.distanceKm,
            durationSeconds: exerciseData.durationSeconds,
            isPersonalRecord: exerciseData.isPersonalRecord,
            userContext
          });

          if (result.status === 'completed') {
            totalPoints += result.totalPoints;

            const calculation = calculationRepository.create({
              userId,
              exerciseId: exerciseData.exerciseId,
              exerciseKey: exerciseData.exercise,
              calculationData: { breakdown: result.breakdown, input: exerciseData },
              pointsEarned: result.totalPoints,
              rulesApplied: result.appliedRules,
              configurationVersion: 1,
              calculationTimeMs: result.calculationTime
            });
            await calculationRepository.save(calculation);
          }

          results.push({
            exercise: exerciseData.exercise,
            points: result.totalPoints,
            status: result.status,
            errors: result.errors
          });
        }

        return reply.send({
          success: true,
          results,
          totalPoints,
          exerciseCount: request.body.exercises.length
        });
      } catch (error) {
        console.error('Bulk calculation error:', error);
        return reply.status(500).send({
          success: false,
          error: 'Bulk calculation failed'
        });
      }
    }
  );

  /**
   * GET /api/v3/points/config/exercises
   * Get exercise configurations
   */
  fastify.get('/config/exercises', async (request, reply) => {
    try {
      const exercises = pointsEngineV3.getAllExercises();

      return reply.send({
        exercises,
        totalCount: exercises.length,
        source: 'yaml'
      });
    } catch (error) {
      console.error('Failed to get exercise config:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to load configuration'
      });
    }
  });

  /**
   * GET /api/v3/points/config/rules
   * Get rules configurations
   */
  fastify.get('/config/rules', async (request, reply) => {
    try {
      const rules = pointsEngineV3.getAllRules();

      return reply.send({
        rules,
        totalCount: rules.length
      });
    } catch (error) {
      console.error('Failed to get rules config:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to load rules'
      });
    }
  });

  /**
   * GET /api/v3/points/config/achievements
   * Get achievements configurations
   */
  fastify.get('/config/achievements', async (request, reply) => {
    try {
      const achievements = pointsEngineV3.getAllAchievements();

      return reply.send({
        achievements,
        totalCount: achievements.length
      });
    } catch (error) {
      console.error('Failed to get achievements config:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to load achievements'
      });
    }
  });

  /**
   * POST /api/v3/points/config/reload
   * Reload configuration from YAML files (admin only)
   */
  fastify.post('/config/reload', async (request, reply) => {
    try {
      // TODO: Add admin authentication check

      await pointsEngineV3.reloadConfig();

      return reply.send({
        success: true,
        message: 'Configuration reloaded successfully'
      });
    } catch (error) {
      console.error('Failed to reload config:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to reload configuration'
      });
    }
  });

  /**
   * GET /api/v3/points/stats/:userId
   * Get user statistics
   */
  fastify.get<{ Params: { userId: string } }>(
    '/stats/:userId',
    async (request: FastifyRequest<{ Params: { userId: string } }>, reply: FastifyReply) => {
      try {
        const { userId } = request.params;

        // Get total points from calculations
        const calculations = await calculationRepository.find({
          where: { userId },
          order: { createdAt: 'DESC' },
          take: 10
        });

        const totalPoints = calculations.reduce((sum, calc) => sum + calc.pointsEarned, 0);

        // Get achievements
        const achievements = await achievementRepository.find({
          where: { userId },
          order: { earnedAt: 'DESC' }
        });

        return reply.send({
          userId,
          totalPoints,
          totalCalculations: calculations.length,
          recentActivity: calculations.map(calc => ({
            exerciseKey: calc.exerciseKey,
            points: calc.pointsEarned,
            createdAt: calc.createdAt
          })),
          achievements: achievements.map(ach => ({
            id: ach.achievementId,
            name: ach.achievementName,
            nameHe: ach.achievementNameHe,
            points: ach.pointsAwarded,
            icon: ach.icon,
            earnedAt: ach.earnedAt
          }))
        });
      } catch (error) {
        console.error('Failed to get user stats:', error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to get statistics'
        });
      }
    }
  );
};

export default pointsV3Routes;
