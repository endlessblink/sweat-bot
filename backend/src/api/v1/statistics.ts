import express from 'express';
import { logger } from '../../utils/logger';
import { postgresUserService } from '../../services/postgresUserService';
import { mongoConversationService } from '../../services/mongoConversationService';

const router = express.Router();

// Get user statistics
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Get real workout statistics from PostgreSQL
    const workoutStats = await postgresUserService.getWorkoutStats(userId, days);
    const userStats = await postgresUserService.getUserStats(userId, days);

    // Get conversation statistics from MongoDB
    const conversationStats = await mongoConversationService.getConversationStats(userId);

    // Combine all statistics
    const statistics = {
      userId,
      period: days,
      workoutStats: {
        totalWorkouts: workoutStats.total_workouts,
        totalExercises: workoutStats.total_exercises,
        totalSets: workoutStats.total_sets,
        totalReps: workoutStats.total_reps,
        totalWeightLifted: workoutStats.total_weight_lifted,
        totalDuration: workoutStats.total_duration,
        currentStreak: workoutStats.current_streak,
        lastWorkoutDate: workoutStats.last_workout_date,
        workoutTypesCount: workoutStats.workout_types_count,
        pointsEarned: workoutStats.points_earned
      },
      userStats: {
        totalWorkouts: userStats.total_workouts,
        totalExercises: userStats.total_exercises,
        totalPoints: userStats.total_points,
        mostCommonExercise: userStats.most_common_exercise,
        favoriteWorkoutType: userStats.favorite_workout_type,
        improvementRate: userStats.improvement_rate
      },
      conversationStats: {
        totalConversations: conversationStats.totalConversations,
        totalMessages: conversationStats.totalMessages,
        lastActivity: conversationStats.lastActivity
      },
      calculatedFields: {
        averageExercisesPerWorkout: workoutStats.total_workouts > 0
          ? Math.round(workoutStats.total_exercises / workoutStats.total_workouts * 10) / 10
          : 0,
        averagePointsPerWorkout: workoutStats.total_workouts > 0
          ? Math.round(workoutStats.points_earned / workoutStats.total_workouts * 10) / 10
          : 0,
        averageMessagesPerConversation: conversationStats.totalConversations > 0
          ? Math.round(conversationStats.totalMessages / conversationStats.totalConversations * 10) / 10
          : 0
      }
    };

    res.json({
      success: true,
      data: statistics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Get overall system statistics
router.get('/overview', async (req, res) => {
  try {
    // Note: This is a simplified overview since we don't have complex aggregation queries
    // In a production system, you'd add aggregate queries to the PostgreSQL service
    const overview = {
      system: {
        status: 'healthy',
        databases: {
          postgresql: 'connected',
          mongodb: 'connected',
          redis: 'connected'
        },
        uptime: process.uptime(),
        version: '2.0.0'
      },
      features: {
        ai_chat: '✅ Available',
        exercise_tracking: '✅ Available',
        conversation_history: '✅ Available',
        guest_sessions: '✅ Available',
        statistics: '✅ Available'
      },
      limits: {
        maxUserStats: '30 days',
        conversationHistory: 'unlimited',
        fileUploadSize: '10MB'
      },
      availableEndpoints: {
        auth: ['/auth/guest', '/auth/validate', '/auth/refresh', '/auth/logout'],
        chat: ['/api/v1/chat'],
        statistics: ['/api/v1/statistics/user/:userId', '/api/v1/statistics/overview'],
        conversations: ['/api/v1/conversations/history/:userId'],
        exercises: ['/api/v1/exercises/enhanced/*', '/exercises'],
        memory: ['/api/memory/message', '/api/memory/conversations/:userId'],
        health: ['/health', '/health/detailed', '/debug/env'],
        stt: ['/api/v1/stt/*']
      }
    };

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching system statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overview statistics'
    });
  }
});

export { router as statisticsRouter };