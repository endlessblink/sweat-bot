/**
 * Exercise Logger Tool
 * Logs exercises to the backend database with Hebrew support
 */

import { z } from 'zod';

// Exercise patterns for Hebrew recognition
const EXERCISE_PATTERNS: Record<string, string> = {
  // Cardio
  'ריצה': 'running',
  'רצתי': 'running',
  'רץ': 'running',
  'הליכה': 'walking',
  'הלכתי': 'walking',
  'הלך': 'walking',
  'אופניים': 'cycling',
  'רכיבה': 'cycling',
  
  // Strength
  'סקוואט': 'squat',
  'סקוואטים': 'squat',
  'שכיבות סמיכה': 'pushup',
  'שכיבות שמיכה': 'pushup',
  'פוש אפ': 'pushup',
  'משיכות': 'pullup',
  'משיכה': 'pullup',
  'פול אפ': 'pullup',
  'ברפי': 'burpee',
  'ברפיז': 'burpee',
  'דדליפט': 'deadlift',
  'בק סקווט': 'back_squat',
  'דחיפות בשכיבה': 'bench_press',
  'בנץ\' פרס': 'bench_press',
  
  // Gymnastics/CrossFit
  'טיפוסי חבל': 'rope_climb',
  'טיפוס חבל': 'rope_climb',
  'חבל': 'rope_climb',
  
  // Core
  'פלאנק': 'plank',
  'כפיפות בטן': 'situp',
  'כפיפת בטן': 'situp',
  'בטן': 'abs'
};

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
      // Calculate points based on exercise type and parameters
      const points = calculatePoints(params);
      
      // Prepare data for backend
      const exerciseData = {
        name: params.exercise,
        name_he: params.exercise_he || translateToHebrew(params.exercise),
        reps: params.reps,
        sets: params.sets,
        weight_kg: params.weight_kg,
        distance_km: params.distance_km,
        duration_seconds: params.duration_seconds,
        notes: params.notes,
        points_earned: points,
        timestamp: new Date().toISOString()
      };
      
      // Send to backend
      const response = await fetch('http://localhost:8000/api/v1/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exerciseData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to log exercise: ${response.statusText}`);
      }
      
      const result = await response.json();
      
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
      
      if (points > 0) {
        message += ` קיבלת ${points} נקודות! 💪`;
      }
      
      // Check for achievements
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
            points: points,
            achievement: result.achievement
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
 * Calculate points for an exercise
 */
function calculatePoints(params: ExerciseLoggerParams): number {
  let points = 0;
  
  // Base points by exercise type
  const basePoints: Record<string, number> = {
    'squat': 2,
    'pushup': 1.5,
    'pullup': 3,
    'burpee': 2.5,
    'running': 5,
    'walking': 2,
    'cycling': 3,
    'deadlift': 3,
    'bench_press': 2.5,
    'rope_climb': 4,
    'plank': 2,
    'situp': 1,
    'abs': 1.5
  };
  
  const base = basePoints[params.exercise.toLowerCase()] || 1;
  
  // Calculate based on parameters
  if (params.reps) {
    points = base * params.reps * (params.sets || 1);
  } else if (params.distance_km) {
    points = base * params.distance_km * 10;
  } else if (params.duration_seconds) {
    points = base * (params.duration_seconds / 60); // Points per minute
  } else {
    points = base * 10; // Default for unspecified
  }
  
  // Weight multiplier
  if (params.weight_kg) {
    points *= (1 + params.weight_kg / 100);
  }
  
  return Math.round(points);
}

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