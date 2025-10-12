/**
 * Personalized Workout Tool
 * Generates custom workouts based on user profile, equipment, and goals
 */

import { z } from 'zod';

const personalizedWorkoutSchema = z.object({
  duration_minutes: z.number()
    .min(5)
    .max(90)
    .default(20)
    .describe('Workout duration in minutes (5-90)'),
  focus_area: z.enum(['strength', 'cardio', 'full_body', 'flexibility'])
    .optional()
    .describe('Optional focus area for the workout')
});

export type PersonalizedWorkoutParams = z.infer<typeof personalizedWorkoutSchema>;

export const personalizedWorkoutTool = {
  name: 'generate_personalized_workout',
  description: 'Generate a custom workout based on user profile, goals, equipment, and available time',
  parameters: personalizedWorkoutSchema,

  execute: async (params: PersonalizedWorkoutParams) => {
    try {
      // Build API request
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const { apiGet, parseJsonResponse } = await import('../../utils/api');

      const queryParams = new URLSearchParams({
        duration_minutes: params.duration_minutes.toString()
      });

      // Fetch personalized workout from backend
      const response = await apiGet(
        `${backendUrl}/api/v1/exercises/personalized-workout?${queryParams}`
      );
      const result = await parseJsonResponse(response);

      // Handle errors
      if (!result.success || !result.workout) {
        throw new Error('Failed to generate workout');
      }

      const workout = result.workout;

      // Build Hebrew message
      let message = `💪 **${workout.name_he || workout.name}**\n`;
      message += `משך משוער: ${workout.duration_minutes} דקות | `;
      message += `רמת קושי: ${translateDifficulty(workout.difficulty)}\n\n`;

      // Add warmup if present
      if (workout.warmup && workout.warmup.exercises && workout.warmup.exercises.length > 0) {
        message += `🔥 **חימום (${workout.warmup.duration_minutes || 3} דקות):**\n`;
        workout.warmup.exercises.forEach((ex: any) => {
          message += `• ${ex.name_he || ex.name}`;
          if (ex.duration_seconds) {
            message += ` - ${ex.duration_seconds} שניות`;
          } else if (ex.reps) {
            message += ` - ${ex.reps} חזרות`;
          }
          message += '\n';
        });
        message += '\n';
      }

      // Add main workout
      const mainDuration = workout.main_duration_minutes ||
                          workout.duration_minutes -
                          (workout.warmup?.duration_minutes || 3) -
                          (workout.cooldown?.duration_minutes || 2);

      message += `💪 **אימון עיקרי (${mainDuration} דקות):**\n`;

      if (workout.rounds && workout.rounds > 1) {
        message += `${workout.rounds} סבבים:\n`;
      }

      workout.exercises.forEach((ex: any) => {
        message += `• `;
        if (ex.reps) {
          message += `${ex.reps} ${ex.name_he || ex.name}`;
        } else if (ex.duration_seconds) {
          const seconds = ex.duration_seconds;
          message += `${seconds} שניות ${ex.name_he || ex.name}`;
        } else {
          message += `${ex.name_he || ex.name}`;
        }

        if (ex.weight_kg) {
          message += ` @ ${ex.weight_kg}kg`;
        }

        if (ex.distance_km) {
          message += ` - ${ex.distance_km}km`;
        }

        message += '\n';
      });
      message += '\n';

      // Add cooldown if present
      if (workout.cooldown && workout.cooldown.exercises && workout.cooldown.exercises.length > 0) {
        message += `😌 **התקררות (${workout.cooldown.duration_minutes || 2} דקות):**\n`;
        workout.cooldown.exercises.forEach((ex: any) => {
          message += `• ${ex.name_he || ex.name}`;
          if (ex.duration_seconds) {
            message += ` - ${ex.duration_seconds} שניות`;
          }
          message += '\n';
        });
        message += '\n';
      }

      // Add personalization note
      const profileCompletion = result.profile_completion || 0;

      if (result.personalization_active && profileCompletion >= 70) {
        message += `✨ **התאמה אישית:** מבוסס על הציוד, המטרות והרמה שלך!\n`;
      } else if (profileCompletion < 70) {
        message += `⚠️ **טיפ:** ${result.workout.message || 'השלם את הפרופיל שלך להמלצות מותאמות יותר!'}\n`;
      }

      // Add motivational closing
      message += `\n🎯 בהצלחה באימון! 💪`;

      return {
        success: true,
        message,
        data: result,
        ui_component: {
          type: 'workout_plan',
          props: {
            workout: workout,
            duration: workout.duration_minutes,
            difficulty: workout.difficulty,
            personalized: result.personalization_active,
            profileCompletion: profileCompletion
          }
        }
      };

    } catch (error) {
      console.error('Personalized workout generation error:', error);
      return {
        success: false,
        message: '❌ לא הצלחתי ליצור אימון מותאם. נסה שוב או בקש עזרה.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Translate difficulty level to Hebrew
 */
function translateDifficulty(difficulty: string): string {
  const translations: Record<string, string> = {
    'beginner': 'מתחיל',
    'easy': 'קל',
    'intermediate': 'בינוני',
    'moderate': 'בינוני',
    'advanced': 'מתקדם',
    'hard': 'קשה',
    'expert': 'מומחה',
    'extreme': 'קיצוני'
  };
  return translations[difficulty?.toLowerCase()] || 'בינוני';
}
