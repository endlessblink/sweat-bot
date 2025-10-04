/**
 * Workout Suggester Tool
 * Suggests personalized workouts based on user history and preferences
 */

import { z } from 'zod';

const workoutSuggesterSchema = z.object({
  workout_type: z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'recovery', 'mixed', 'auto'])
    .default('auto')
    .describe('Type of workout to suggest'),
  duration_minutes: z.number()
    .min(5)
    .max(120)
    .default(30)
    .describe('Desired workout duration in minutes'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'auto'])
    .default('auto')
    .describe('Difficulty level'),
  equipment: z.array(z.string())
    .optional()
    .describe('Available equipment'),
  focus_area: z.enum(['upper_body', 'lower_body', 'core', 'full_body', 'auto'])
    .optional()
    .describe('Body area to focus on')
});

export type WorkoutSuggesterParams = z.infer<typeof workoutSuggesterSchema>;

export const workoutSuggesterTool = {
  name: 'suggest_workout',
  description: 'Generate personalized workout suggestions based on user history and preferences',
  parameters: workoutSuggesterSchema,
  
  execute: async (params: WorkoutSuggesterParams) => {
    try {
      // Get user profile and history for personalization
      const profileResponse = await fetch('http://localhost:8000/api/v1/exercises/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const profile = profileResponse.ok ? await profileResponse.json() : {};
      
      // Request workout suggestion from backend
      const response = await fetch('http://localhost:8000/api/v1/exercises/suggest-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...params,
          user_profile: profile
        })
      });
      
      if (!response.ok) {
        throw new Error(`Workout suggestion failed: ${response.statusText}`);
      }
      
      const suggestion = await response.json();
      
      // Build workout message
      let message = `🏋️ **האימון המומלץ שלך להיום:**\n\n`;
      
      // Workout header
      message += `📋 **${suggestion.name || getWorkoutName(params.workout_type)}**\n`;
      message += `⏱️ משך: ${params.duration_minutes} דקות\n`;
      message += `💪 רמה: ${getDifficultyName(suggestion.difficulty || params.difficulty)}\n`;
      
      if (suggestion.calories_estimate) {
        message += `🔥 קלוריות משוערות: ${suggestion.calories_estimate}\n`;
      }
      
      message += '\n---\n\n';
      
      // Warm-up
      if (suggestion.warmup && suggestion.warmup.length > 0) {
        message += `🔥 **חימום (5 דקות):**\n`;
        for (const exercise of suggestion.warmup) {
          message += formatExercise(exercise);
        }
        message += '\n';
      }
      
      // Main workout
      if (suggestion.main_workout && suggestion.main_workout.length > 0) {
        message += `💪 **אימון מרכזי:**\n`;
        
        if (suggestion.workout_structure === 'circuit') {
          message += `*בצע ${suggestion.circuits || 3} סבבים של:*\n`;
        }
        
        for (let i = 0; i < suggestion.main_workout.length; i++) {
          const exercise = suggestion.main_workout[i];
          message += `${i + 1}. ${formatExercise(exercise)}`;
          
          // Add rest between exercises if specified
          if (exercise.rest_seconds) {
            message += `   ⏸️ מנוחה: ${exercise.rest_seconds} שניות\n`;
          }
        }
        
        if (suggestion.rest_between_circuits) {
          message += `\n⏸️ **מנוחה בין סבבים:** ${suggestion.rest_between_circuits} שניות\n`;
        }
        
        message += '\n';
      }
      
      // Cool-down
      if (suggestion.cooldown && suggestion.cooldown.length > 0) {
        message += `🧘 **צינון ומתיחות (5 דקות):**\n`;
        for (const exercise of suggestion.cooldown) {
          message += formatExercise(exercise);
        }
        message += '\n';
      }
      
      // Tips and notes
      if (suggestion.tips && suggestion.tips.length > 0) {
        message += `💡 **טיפים:**\n`;
        for (const tip of suggestion.tips) {
          message += `• ${tip}\n`;
        }
        message += '\n';
      }
      
      // Motivational message
      message += getWorkoutMotivation(params.workout_type, params.difficulty);
      
      // Alternative exercises
      if (suggestion.alternatives) {
        message += `\n\n🔄 **חלופות:** אם תרגיל מסוים קשה, תוכל להחליף ל:\n`;
        for (const [exercise, alternative] of Object.entries(suggestion.alternatives)) {
          message += `• ${exercise} → ${alternative}\n`;
        }
      }
      
      return {
        success: true,
        message,
        data: suggestion,
        ui_component: {
          type: 'workout_plan',
          props: {
            workout: suggestion,
            canStart: true,
            canModify: true,
            estimatedPoints: suggestion.estimated_points || 0
          }
        }
      };
    } catch (error) {
      console.error('Workout suggestion error:', error);
      
      // Fallback to basic workout if API fails
      const fallbackWorkout = generateFallbackWorkout(params);
      
      return {
        success: true,
        message: fallbackWorkout,
        data: null
      };
    }
  }
};

/**
 * Format single exercise for display
 */
function formatExercise(exercise: any): string {
  let formatted = `• **${exercise.name_he || exercise.name}**`;
  
  if (exercise.reps) {
    formatted += ` - ${exercise.reps} חזרות`;
  } else if (exercise.duration_seconds) {
    formatted += ` - ${exercise.duration_seconds} שניות`;
  } else if (exercise.distance_km) {
    formatted += ` - ${exercise.distance_km} ק"מ`;
  }
  
  if (exercise.sets && exercise.sets > 1) {
    formatted += ` × ${exercise.sets} סטים`;
  }
  
  if (exercise.weight_kg) {
    formatted += ` (${exercise.weight_kg} ק"ג)`;
  }
  
  if (exercise.notes) {
    formatted += `\n  💭 ${exercise.notes}`;
  }
  
  formatted += '\n';
  
  return formatted;
}

/**
 * Get workout name in Hebrew
 */
function getWorkoutName(type: string): string {
  const names: Record<string, string> = {
    'strength': 'אימון כוח',
    'cardio': 'אימון אירובי',
    'flexibility': 'גמישות ומתיחות',
    'hiit': 'HIIT - אימון אינטרוולים',
    'recovery': 'אימון התאוששות',
    'mixed': 'אימון משולב',
    'auto': 'אימון מותאם אישית'
  };
  
  return names[type] || 'אימון כושר';
}

/**
 * Get difficulty name in Hebrew
 */
function getDifficultyName(difficulty: string): string {
  const names: Record<string, string> = {
    'beginner': 'מתחילים',
    'intermediate': 'בינוני',
    'advanced': 'מתקדמים',
    'auto': 'מותאם אישית'
  };
  
  return names[difficulty] || difficulty;
}

/**
 * Get motivational message based on workout type
 */
function getWorkoutMotivation(type: string, difficulty: string): string {
  const messages: Record<string, string> = {
    'strength': '💪 זכור: הכוח האמיתי מגיע מהתמדה!',
    'cardio': '🏃 כל צעד מקרב אותך למטרה!',
    'flexibility': '🧘 גמישות הגוף מביאה גמישות המחשבה.',
    'hiit': '🔥 דחוף את הגבולות שלך! אתה יכול!',
    'recovery': '🌱 מנוחה היא חלק חשוב מההתקדמות.',
    'mixed': '⚡ גיוון הוא המפתח להצלחה!'
  };
  
  return messages[type] || '🌟 בהצלחה באימון! אתה יכול לעשות את זה!';
}

/**
 * Generate fallback workout if API fails
 */
function generateFallbackWorkout(params: WorkoutSuggesterParams): string {
  const duration = params.duration_minutes;
  
  let workout = `🏋️ **אימון בסיסי (${duration} דקות):**\n\n`;
  
  // Warm-up
  workout += `🔥 **חימום (5 דקות):**\n`;
  workout += `• ריצה במקום - 1 דקה\n`;
  workout += `• מעגלי ידיים - 30 שניות לכל כיוון\n`;
  workout += `• Jumping Jacks - 1 דקה\n`;
  workout += `• מתיחות דינמיות - 2 דקות\n\n`;
  
  // Main workout based on type
  const mainDuration = duration - 10; // Minus warm-up and cool-down
  
  if (params.workout_type === 'strength' || params.workout_type === 'auto') {
    workout += `💪 **אימון מרכזי (${mainDuration} דקות):**\n`;
    workout += `בצע 3 סבבים של:\n`;
    workout += `• 15 סקוואטים\n`;
    workout += `• 10 שכיבות סמיכה\n`;
    workout += `• 20 כפיפות בטן\n`;
    workout += `• 30 שניות פלאנק\n`;
    workout += `• 10 ברפיז\n`;
    workout += `⏸️ מנוחה 1 דקה בין סבבים\n\n`;
  } else if (params.workout_type === 'cardio') {
    workout += `🏃 **אימון מרכזי (${mainDuration} דקות):**\n`;
    workout += `• ריצה/הליכה מהירה - ${mainDuration / 2} דקות\n`;
    workout += `• אינטרוולים:\n`;
    workout += `  - 30 שניות ספרינט\n`;
    workout += `  - 30 שניות הליכה\n`;
    workout += `  - חזור ${mainDuration / 4} פעמים\n\n`;
  }
  
  // Cool-down
  workout += `🧘 **צינון (5 דקות):**\n`;
  workout += `• הליכה איטית - 2 דקות\n`;
  workout += `• מתיחות סטטיות - 3 דקות\n\n`;
  
  workout += `💡 **טיפ:** התאם את הקצב והעצימות לרמת הכושר שלך!\n`;
  workout += `🌟 בהצלחה! כל אימון מקרב אותך ליעד!`;
  
  return workout;
}