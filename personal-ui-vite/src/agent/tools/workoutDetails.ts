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

// Mock data for demonstration
const mockExercises = [
  {
    id: '1',
    name: 'Squats',
    hebrew_name: 'סקוואטים',
    sets: 3,
    reps: 20,
    points: 60,
    timestamp: new Date().toISOString(),
    category: 'strength'
  },
  {
    id: '2',
    name: 'Running',
    hebrew_name: 'ריצה',
    distance: 5,
    duration: 25,
    points: 75,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    category: 'cardio'
  },
  {
    id: '3',
    name: 'Push-ups',
    hebrew_name: 'שכיבות סמיכה',
    sets: 4,
    reps: 15,
    points: 45,
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    category: 'strength'
  },
  {
    id: '4',
    name: 'Back Squat',
    hebrew_name: 'בק סקווט',
    sets: 5,
    reps: 5,
    weight: 50,
    points: 100,
    timestamp: new Date(Date.now() - 259200000).toISOString(),
    category: 'strength'
  },
  {
    id: '5',
    name: 'Rope Climbs',
    hebrew_name: 'טיפוסי חבל',
    sets: 1,
    reps: 4,
    points: 40,
    timestamp: new Date(Date.now() - 345600000).toISOString(),
    category: 'functional'
  },
  {
    id: '6',
    name: 'Burpees',
    hebrew_name: 'ברפיז',
    sets: 3,
    reps: 10,
    points: 50,
    timestamp: new Date(Date.now() - 432000000).toISOString(),
    category: 'cardio'
  },
  {
    id: '7',
    name: 'Deadlift',
    hebrew_name: 'דדליפט',
    sets: 3,
    reps: 8,
    weight: 80,
    points: 120,
    timestamp: new Date(Date.now() - 518400000).toISOString(),
    category: 'strength'
  },
  {
    id: '8',
    name: 'Box Jumps',
    hebrew_name: 'קפיצות קופסה',
    sets: 4,
    reps: 12,
    points: 48,
    timestamp: new Date(Date.now() - 604800000).toISOString(),
    category: 'plyometric'
  },
  {
    id: '9',
    name: 'Pull-ups',
    hebrew_name: 'משיכות',
    sets: 3,
    reps: 8,
    points: 55,
    timestamp: new Date(Date.now() - 691200000).toISOString(),
    category: 'strength'
  },
  {
    id: '10',
    name: 'Rowing',
    hebrew_name: 'חתירה',
    distance: 2,
    duration: 8,
    points: 40,
    timestamp: new Date(Date.now() - 777600000).toISOString(),
    category: 'cardio'
  },
  {
    id: '11',
    name: 'Wall Balls',
    hebrew_name: 'וול בולס',
    sets: 3,
    reps: 20,
    weight: 9,
    points: 65,
    timestamp: new Date(Date.now() - 864000000).toISOString(),
    category: 'functional'
  },
  {
    id: '12',
    name: 'Double Unders',
    hebrew_name: 'דאבל אנדרס',
    sets: 5,
    reps: 50,
    points: 70,
    timestamp: new Date(Date.now() - 950400000).toISOString(),
    category: 'cardio'
  }
];

export const workoutDetailsTool = {
  name: 'get_workout_details',
  description: 'Get detailed workout history with structured display',
  parameters: workoutDetailsSchema,
  
  execute: async (params: WorkoutDetailsParams) => {
    try {
      // Filter exercises based on period
      const now = new Date();
      let filteredExercises = [...mockExercises];
      
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