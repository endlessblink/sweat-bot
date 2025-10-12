/**
 * Workout Details Tool
 * Retrieves and displays detailed workout history with structured HTML view
 */

import { z } from 'zod';

const workoutDetailsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'all_time'])
    .default('month')
    .describe('Time period for workout details'),
  detailed: z.boolean()
    .default(true)
    .describe('Include full exercise details')
});

export type WorkoutDetailsParams = z.infer<typeof workoutDetailsSchema>;

export const workoutDetailsTool = {
  name: 'get_workout_details',
  description: 'Get detailed workout history with structured display',
  parameters: workoutDetailsSchema,

  execute: async (params: WorkoutDetailsParams) => {
    try {
      // Calculate days based on period
      const daysMap = {
        'today': 1,
        'week': 7,
        'month': 30,
        'all_time': 365
      };
      const days = daysMap[params.period];

      // Fetch real exercise history from backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const { apiGet, parseJsonResponse } = await import('../../utils/api');

      const response = await apiGet(`${backendUrl}/api/v1/exercises/history?days=${days}`);
      const exercises = await parseJsonResponse(response);

      // If no exercises, return helpful message
      if (!exercises || exercises.length === 0) {
        return {
          success: true,
          message: '📊 אין תרגילים לתקופה זו.\n\nהתחל לאמן ותראה את ההיסטוריה שלך כאן! 💪',
          data: { exercises: [], totalPoints: 0, period: params.period }
        };
      }

      // Filter exercises based on period (extra safety)
      const now = new Date();
      let filteredExercises = exercises;
      
      switch (params.period) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          filteredExercises = mockExercises.filter(ex => 
            new Date(ex.timestamp) >= today
          );
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filteredExercises = mockExercises.filter(ex => 
            new Date(ex.timestamp) >= weekAgo
          );
          break;
        case 'month':
          // Default - all 12 exercises are within a month
          break;
      }
      
      const totalPoints = filteredExercises.reduce((sum, ex) => sum + ex.points, 0);
      
      // Group by date for better display
      const exercisesByDate: Record<string, typeof mockExercises> = {};
      filteredExercises.forEach(exercise => {
        const date = new Date(exercise.timestamp).toLocaleDateString('he-IL', {
          weekday: 'short',
          day: 'numeric',
          month: 'short'
        });
        if (!exercisesByDate[date]) {
          exercisesByDate[date] = [];
        }
        exercisesByDate[date].push(exercise);
      });
      
      // Build detailed message
      let message = `📊 **פירוט ${filteredExercises.length} האימונים שלך החודש:**\n\n`;
      
      Object.entries(exercisesByDate).forEach(([date, exercises]) => {
        message += `**${date}:**\n`;
        exercises.forEach(ex => {
          message += `• ${ex.hebrew_name}`;
          if (ex.sets && ex.reps) {
            message += ` - ${ex.sets}x${ex.reps}`;
          }
          if (ex.weight) {
            message += ` @ ${ex.weight}kg`;
          }
          if (ex.distance) {
            message += ` - ${ex.distance}km`;
          }
          if (ex.duration) {
            message += ` ב-${ex.duration} דקות`;
          }
          message += ` (+${ex.points} נקודות)\n`;
        });
        message += '\n';
      });
      
      message += `\n**סיכום:**\n`;
      message += `• סה"כ נקודות: ${totalPoints}\n`;
      message += `• ממוצע לאימון: ${Math.round(totalPoints / filteredExercises.length)}\n`;
      message += `• ימי אימון: ${Object.keys(exercisesByDate).length}\n`;
      
      // Category breakdown
      const categories = filteredExercises.reduce((acc, ex) => {
        acc[ex.category] = (acc[ex.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      message += `\n**לפי קטגוריה:**\n`;
      Object.entries(categories).forEach(([cat, count]) => {
        const catHebrew: Record<string, string> = {
          strength: 'כוח',
          cardio: 'אירובי',
          functional: 'פונקציונלי',
          plyometric: 'פליומטרי'
        };
        message += `• ${catHebrew[cat] || cat}: ${count} תרגילים\n`;
      });
      
      return {
        success: true,
        message,
        data: {
          exercises: filteredExercises,
          totalPoints,
          period: params.period
        },
        ui_component: {
          type: 'workout_details',
          props: {
            exercises: filteredExercises,
            totalPoints,
            period: params.period === 'month' ? 'החודש' : params.period
          }
        }
      };
    } catch (error) {
      console.error('Workout details error:', error);
      return {
        success: false,
        message: '❌ לא הצלחתי לטעון את פירוט האימונים',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};