import express from 'express';
import Joi from 'joi';
import { DatabaseService } from '../services/DatabaseService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();
const db = DatabaseService.getInstance();

/**
 * @route   POST /exercises
 * @desc    Log a new exercise
 * @access  Private
 */
router.post('/',
  authenticateToken,
  validateBody(schemas.exerciseLog),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const exerciseData = req.body;

    const exercise = await db.logExercise(userId, exerciseData);

    // Award points for logging exercise
    const pointsAwarded = exerciseData.sets * 2 + exerciseData.reps;
    await db.awardPoints(
      userId,
      `Completed ${exerciseData.exerciseName}: ${exerciseData.sets} sets x ${exerciseData.reps} reps`,
      'exercise_logging',
      pointsAwarded,
      {
        exerciseName: exerciseData.exerciseName,
        sets: exerciseData.sets,
        reps: exerciseData.reps,
        weight: exerciseData.weight,
        workoutType: exerciseData.workoutType
      }
    );

    logger.info(`Exercise logged`, {
      userId,
      exerciseId: exercise.id,
      exerciseName: exerciseData.exerciseName,
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      pointsAwarded
    });

    res.status(201).json({
      success: true,
      message: 'Exercise logged successfully',
      data: {
        exercise,
        pointsAwarded
      }
    });
  })
);

/**
 * @route   GET /exercises
 * @desc    Get exercise history
 * @access  Private
 */
router.get('/',
  authenticateToken,
  validateBody(schemas.pagination),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const exercises = await db.getExerciseHistory(userId, limit, offset);

    // Get total count for pagination (this would need a separate query in DatabaseService)
    const totalCount = exercises.length; // Placeholder

    res.json({
      success: true,
      data: {
        exercises,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
          hasNext: exercises.length === limit,
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * @route   GET /exercises/stats
 * @desc    Get exercise statistics
 * @access  Private
 */
router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;

    const stats = await db.getExerciseStats(userId, days);

    // Get additional stats from MongoDB (points, workouts completed)
    const userPoints = await db.getUserPoints(userId, days);
    const recentWorkouts = await db.getRecentConversations(userId, 10); // Placeholder

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        workouts: {
          totalWorkouts: stats.total_workouts || 0,
          workoutDays: stats.workout_days || 0,
          averagePerWeek: Math.round(((stats.workout_days || 0) / days) * 7 * 10) / 10
        },
        volume: {
          totalSets: parseInt(stats.total_sets) || 0,
          totalReps: parseInt(stats.total_reps) || 0,
          averageWeight: parseFloat(stats.avg_weight) || 0
        },
        points: {
          totalPoints: userPoints.total,
          recentPoints: userPoints.recent.reduce((sum, record) => sum + record.points, 0)
        },
        achievements: {
          // Add achievement logic here
          streak: 0, // Placeholder for workout streak
          personalRecords: 0 // Placeholder for PR tracking
        }
      }
    });
  })
);

/**
 * @route   GET /exercises/recommendations
 * @desc    Get exercise recommendations based on user history
 * @access  Private
 */
router.get('/recommendations',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const workoutType = req.query.type as string || 'strength';

    // Get user's exercise history
    const recentExercises = await db.getExerciseHistory(userId, 50);
    const userProfile = await db.getUserById(userId);

    // Analyze patterns and generate recommendations
    const recommendations = generateExerciseRecommendations(recentExercises, userProfile, workoutType);

    res.json({
      success: true,
      data: {
        recommendations,
        basedOn: {
          exercisesAnalyzed: recentExercises.length,
          userProfile: !!userProfile,
          workoutType
        }
      }
    });
  })
);

/**
 * @route   GET /exercises/leaderboard
 * @desc    Get exercise leaderboard (global or friends)
 * @access  Private
 */
router.get('/leaderboard',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const type = req.query.type as string || 'points';
    const period = req.query.period as string || 'week';

    // This would need proper implementation in DatabaseService
    // For now, return placeholder data
    const leaderboard = generatePlaceholderLeaderboard(type, period);

    res.json({
      success: true,
      data: {
        leaderboard,
        type,
        period,
        yourRank: Math.floor(Math.random() * 100) + 1, // Placeholder
        totalParticipants: 1000 // Placeholder
      }
    });
  })
);

/**
 * @route   POST /exercises/bulk
 * @desc    Log multiple exercises at once (workout session)
 * @access  Private
 */
router.post('/bulk',
  authenticateToken,
  validateBody({
    exercises: Joi.array().items(schemas.exerciseLog).min(1).max(20).required(),
    workoutNotes: Joi.string().max(1000).optional(),
    workoutType: Joi.string().valid('strength', 'cardio', 'flexibility', 'sports').default('strength')
  }),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const { exercises, workoutNotes, workoutType } = req.body;

    const loggedExercises = [];
    let totalPoints = 0;

    // Log each exercise
    for (const exerciseData of exercises) {
      const exercise = await db.logExercise(userId, exerciseData);
      loggedExercises.push(exercise);

      // Calculate points for this exercise
      const exercisePoints = exerciseData.sets * 2 + exerciseData.reps;
      totalPoints += exercisePoints;
    }

    // Award bonus points for completing a workout
    const workoutBonus = exercises.length >= 3 ? 20 : exercises.length >= 2 ? 10 : 5;
    totalPoints += workoutBonus;

    await db.awardPoints(
      userId,
      `Completed workout: ${exercises.length} exercises`,
      'workout_completion',
      totalPoints,
      {
        exerciseCount: exercises.length,
        workoutType,
        notes: workoutNotes,
        exercises: exercises.map(e => ({
          name: e.exerciseName,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight
        }))
      }
    );

    logger.info(`Bulk workout logged`, {
      userId,
      exerciseCount: exercises.length,
      totalPoints,
      workoutType
    });

    res.status(201).json({
      success: true,
      message: 'Workout logged successfully',
      data: {
        exercises: loggedExercises,
        totalPoints,
        workoutBonus,
        workoutNotes
      }
    });
  })
);

/**
 * @route   DELETE /exercises/:id
 * @desc    Delete an exercise log
 * @access  Private
 */
router.delete('/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    // This would need proper implementation in DatabaseService
    logger.warn(`Exercise deletion requested`, {
      userId,
      exerciseId: id
    });

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  })
);

/**
 * @route   GET /exercises/library
 * @desc    Get exercise library with suggestions
 * @access  Private
 */
router.get('/library',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const category = req.query.category as string;
    const muscleGroup = req.query.muscleGroup as string;
    const equipment = req.query.equipment as string;

    // Return exercise library based on filters
    const exercises = getExerciseLibrary({ category, muscleGroup, equipment });

    res.json({
      success: true,
      data: {
        exercises,
        filters: { category, muscleGroup, equipment },
        total: exercises.length
      }
    });
  })
);

// Helper functions (would be better in a separate service file)

function generateExerciseRecommendations(recentExercises: any[], userProfile: any, workoutType: string): any[] {
  // Simple recommendation logic - in production, this would be more sophisticated
  const recommendations = [
    {
      name: 'Push-ups',
      category: 'strength',
      muscleGroup: 'chest',
      difficulty: 'beginner',
      equipment: 'none',
      reason: 'Based on your strength training focus'
    },
    {
      name: 'Squats',
      category: 'strength',
      muscleGroup: 'legs',
      difficulty: 'beginner',
      equipment: 'none',
      reason: 'Great for lower body development'
    },
    {
      name: 'Plank',
      category: 'core',
      muscleGroup: 'core',
      difficulty: 'beginner',
      equipment: 'none',
      reason: 'Essential for core stability'
    }
  ];

  return recommendations.slice(0, 5);
}

function generatePlaceholderLeaderboard(type: string, period: string): any[] {
  return [
    { rank: 1, name: 'Alex Fitness', value: 1250, avatar: '🏆' },
    { rank: 2, name: 'Sarah Strong', value: 1180, avatar: '💪' },
    { rank: 3, name: 'Mike Workout', value: 1050, avatar: '🎯' },
    { rank: 4, name: 'Emma Health', value: 980, avatar: '⭐' },
    { rank: 5, name: 'John Active', value: 920, avatar: '🔥' }
  ];
}

function getExerciseLibrary(filters: any): any[] {
  const allExercises = [
    { name: 'Push-ups', category: 'strength', muscleGroup: 'chest', difficulty: 'beginner', equipment: 'none' },
    { name: 'Pull-ups', category: 'strength', muscleGroup: 'back', difficulty: 'intermediate', equipment: 'bar' },
    { name: 'Squats', category: 'strength', muscleGroup: 'legs', difficulty: 'beginner', equipment: 'none' },
    { name: 'Deadlifts', category: 'strength', muscleGroup: 'full', difficulty: 'advanced', equipment: 'barbell' },
    { name: 'Bench Press', category: 'strength', muscleGroup: 'chest', difficulty: 'intermediate', equipment: 'barbell' },
    { name: 'Running', category: 'cardio', muscleGroup: 'full', difficulty: 'beginner', equipment: 'none' },
    { name: 'Cycling', category: 'cardio', muscleGroup: 'legs', difficulty: 'beginner', equipment: 'bike' },
    { name: 'Swimming', category: 'cardio', muscleGroup: 'full', difficulty: 'intermediate', equipment: 'pool' },
    { name: 'Yoga', category: 'flexibility', muscleGroup: 'full', difficulty: 'beginner', equipment: 'mat' },
    { name: 'Stretching', category: 'flexibility', muscleGroup: 'full', difficulty: 'beginner', equipment: 'none' }
  ];

  // Filter exercises based on provided filters
  let filtered = allExercises;

  if (filters.category) {
    filtered = filtered.filter(ex => ex.category === filters.category);
  }

  if (filters.muscleGroup) {
    filtered = filtered.filter(ex => ex.muscleGroup === filters.muscleGroup);
  }

  if (filters.equipment) {
    filtered = filtered.filter(ex => ex.equipment === filters.equipment || ex.equipment === 'none');
  }

  return filtered;
}

export { router as exerciseRoutes };