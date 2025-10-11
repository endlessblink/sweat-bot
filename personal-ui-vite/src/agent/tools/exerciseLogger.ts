/**
 * Exercise Logger Tool
 * Logs exercises to the backend database with Hebrew support
 */

import { z } from 'zod';

// Tool schema
const exerciseLoggerSchema = z.object({
  exercise: z.string().describe('Exercise name in English'),
  exercise_he: z.string().optional().describe('Exercise name in Hebrew'),
  reps: z.number().optional().describe('Number of repetitions'),
  sets: z.number().default(1).describe('Number of sets'),
  weight_kg: z.number().optional().describe('Weight in kilograms'),
  distance_km: z.number().optional().describe('Distance in kilometers'),
  duration_seconds: z.number().optional().describe('Duration in seconds'),
  notes: z.string().optional().describe('Additional notes')
});

export type ExerciseLoggerParams = z.infer<typeof exerciseLoggerSchema>;

export const exerciseLoggerTool = {
  name: 'log_exercise',
  description: 'Log an exercise activity with automatic Hebrew recognition and point calculation',
  parameters: exerciseLoggerSchema,
  
  execute: async (params: ExerciseLoggerParams) => {
    try {
      // Prepare data for backend (Points v3 will calculate server-side)
      const exerciseData = {
        name: params.exercise,
        name_he: params.exercise_he || translateToHebrew(params.exercise),
        reps: params.reps,
        sets: params.sets,
        weight_kg: params.weight_kg,
        distance_km: params.distance_km,
        duration_seconds: params.duration_seconds,
        notes: params.notes,
        timestamp: new Date().toISOString()
      };
      
      // Send to backend using authenticated fetch (with automatic token refresh)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const { apiPost, parseJsonResponse } = await import('../../utils/api');

      const response = await apiPost(`${backendUrl}/exercises/log`, exerciseData);
      const result = await parseJsonResponse(response);

      // Get points from backend response (Points v3 calculated)
      const backendPoints = result.points_earned || 0;

      // Build success message in Hebrew
      let message = `✅ `;

      if (params.distance_km) {
        message += `${params.exercise_he || translateToHebrew(params.exercise)} ${params.distance_km} ק"מ נרשם בהצלחה!`;
      } else if (params.reps) {
        const hebrewName = params.exercise_he || translateToHebrew(params.exercise);
        message += `${params.reps} ${hebrewName} נרשמו בהצלחה!`;
      } else if (params.duration_seconds) {
        const minutes = Math.floor(params.duration_seconds / 60);
        message += `${params.exercise_he || translateToHebrew(params.exercise)} למשך ${minutes} דקות נרשם בהצלחה!`;
      } else {
        message += `${params.exercise_he || translateToHebrew(params.exercise)} נרשם בהצלחה!`;
      }

      // Show Points v3 calculated points
      if (backendPoints > 0) {
        message += ` קיבלת ${backendPoints} נקודות! 💪`;
      }

      // Check for achievements or personal records
      if (result.is_personal_record) {
        message += `\n🏆 שיא אישי חדש!`;
      }

      if (result.achievement) {
        message += `\n🏆 הישג חדש: ${result.achievement}`;
      }

      return {
        success: true,
        message,
        data: result,
        ui_component: {
          type: 'exercise_card',
          props: {
            exercise: exerciseData,
            points: backendPoints,  // Use backend-calculated points
            achievement: result.achievement,
            is_personal_record: result.is_personal_record
          }
        }
      };
    } catch (error) {
      console.error('Exercise logging error:', error);
      return {
        success: false,
        message: '❌ שגיאה ברישום התרגיל. נסה שוב.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * REMOVED: Old hardcoded points calculation
 * Points are now calculated server-side using Points v3 engine with YAML configuration
 * This provides:
 * - Centralized points logic in backend
 * - Dynamic multipliers and bonuses
 * - Rule-based calculations (streaks, time-of-day, personal records)
 * - Easier balancing and updates via YAML config
 */

/**
 * Translate English exercise name to Hebrew
 */
function translateToHebrew(exercise: string): string {
  const translations: Record<string, string> = {
    'squat': 'סקוואט',
    'pushup': 'שכיבות סמיכה',
    'pullup': 'משיכות',
    'burpee': 'ברפי',
    'running': 'ריצה',
    'walking': 'הליכה',
    'cycling': 'אופניים',
    'deadlift': 'דדליפט',
    'bench_press': 'דחיפות בשכיבה',
    'rope_climb': 'טיפוסי חבל',
    'plank': 'פלאנק',
    'situp': 'כפיפות בטן',
    'abs': 'בטן'
  };
  
  return translations[exercise.toLowerCase()] || exercise;
}
