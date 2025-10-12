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
      const { getBackendUrl } = await import('../../utils/env');
      const backendUrl = getBackendUrl();
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

      // Calculate total points
      const totalPoints = filteredExercises.reduce((sum: number, ex: any) =>
        sum + (ex.points_earned || 0), 0
      );

      // Group by date for better display
      const exercisesByDate: Record<string, any[]> = {};
      filteredExercises.forEach((exercise: any) => {
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
      const periodName = params.period === 'today' ? 'היום' :
                        params.period === 'week' ? 'השבוע' :
                        params.period === 'month' ? 'החודש' : 'כל הזמן';

      let message = `📊 **פירוט ${filteredExercises.length} תרגילים ${periodName}:**\n\n`;

      Object.entries(exercisesByDate).forEach(([date, exercises]) => {
        message += `**${date}:**\n`;
        exercises.forEach((ex: any) => {
          message += `• ${ex.name_he}`;
          if (ex.sets && ex.reps) {
            message += ` - ${ex.sets}x${ex.reps}`;
          }
          if (ex.weight_kg) {
            message += ` @ ${ex.weight_kg}kg`;
          }
          if (ex.distance_km) {
            message += ` - ${ex.distance_km}km`;
          }
          if (ex.duration_seconds) {
            const minutes = Math.floor(ex.duration_seconds / 60);
            message += ` ב-${minutes} דקות`;
          }
          message += ` (+${ex.points_earned} נקודות)\n`;
        });
        message += '\n';
      });

      message += `\n**סיכום:**\n`;
      message += `• סה"כ נקודות: ${totalPoints}\n`;
      message += `• ממוצע לתרגיל: ${Math.round(totalPoints / filteredExercises.length)}\n`;
      message += `• ימי אימון: ${Object.keys(exercisesByDate).length}\n`;

      // Category breakdown
      const categories = filteredExercises.reduce((acc: Record<string, number>, ex: any) => {
        const cat = ex.category || 'אחר';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

      if (Object.keys(categories).length > 0) {
        message += `\n**לפי קטגוריה:**\n`;
        Object.entries(categories).forEach(([cat, count]) => {
          const catHebrew: Record<string, string> = {
            strength: 'כוח',
            cardio: 'אירובי',
            functional: 'פונקציונלי',
            plyometric: 'פליומטרי',
            flexibility: 'גמישות'
          };
          message += `• ${catHebrew[cat] || cat}: ${count} תרגילים\n`;
        });
      }
      
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