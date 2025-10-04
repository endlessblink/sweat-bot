/**
 * Statistics Retriever Tool
 * Gets user statistics, points, and progress from the backend
 */

import { z } from 'zod';

const statsRetrieverSchema = z.object({
  stat_type: z.enum(['points', 'exercises', 'progress', 'achievements', 'all'])
    .default('all')
    .describe('Type of statistics to retrieve'),
  time_period: z.enum(['today', 'week', 'month', 'all_time'])
    .default('all_time')
    .describe('Time period for statistics'),
  detailed: z.boolean()
    .default(true)
    .describe('Include detailed breakdown')
});

export type StatsRetrieverParams = z.infer<typeof statsRetrieverSchema>;

export const statsRetrieverTool = {
  name: 'get_statistics',
  description: 'Retrieve user fitness statistics, points, achievements, and progress',
  parameters: statsRetrieverSchema,
  
  execute: async (params: StatsRetrieverParams) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        type: params.stat_type,
        period: params.time_period,
        detailed: params.detailed.toString()
      });
      
      // Fetch statistics from backend
      const response = await fetch(
        `http://localhost:8000/api/v1/exercises/statistics?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch statistics: ${response.statusText}`);
      }
      
      const stats = await response.json();
      
      // Format message based on stat type
      let message = '';
      
      if (params.stat_type === 'points' || params.stat_type === 'all') {
        message += `📊 **הנקודות שלך:**\n`;
        message += `• סה"כ: ${stats.total_points || 0} נקודות\n`;
        
        if (stats.points_breakdown) {
          message += `• היום: ${stats.points_breakdown.today || 0} נקודות\n`;
          message += `• השבוע: ${stats.points_breakdown.week || 0} נקודות\n`;
          message += `• החודש: ${stats.points_breakdown.month || 0} נקודות\n`;
        }
        
        message += '\n';
      }
      
      if (params.stat_type === 'exercises' || params.stat_type === 'all') {
        message += `💪 **סיכום תרגילים:**\n`;
        message += `• סה"כ תרגילים: ${stats.total_exercises || 0}\n`;
        
        if (stats.exercises_by_type && Object.keys(stats.exercises_by_type).length > 0) {
          message += `• לפי סוג:\n`;
          for (const [type, count] of Object.entries(stats.exercises_by_type)) {
            message += `  - ${translateExerciseType(type)}: ${count}\n`;
          }
        }
        
        message += '\n';
      }
      
      if (params.stat_type === 'progress' || params.stat_type === 'all') {
        if (stats.progress) {
          message += `📈 **התקדמות:**\n`;
          message += `• רמה נוכחית: ${stats.progress.level || 'מתחיל'}\n`;
          message += `• רצף ימים: ${stats.progress.streak || 0} ימים\n`;
          
          if (stats.progress.next_level_points) {
            const remaining = stats.progress.next_level_points - (stats.total_points || 0);
            message += `• לרמה הבאה: עוד ${remaining} נקודות\n`;
          }
          
          message += '\n';
        }
      }
      
      if (params.stat_type === 'achievements' || params.stat_type === 'all') {
        if (stats.achievements && stats.achievements.length > 0) {
          message += `🏆 **הישגים:**\n`;
          for (const achievement of stats.achievements.slice(0, 5)) {
            message += `• ${achievement.name}: ${achievement.description}\n`;
          }
          
          if (stats.achievements.length > 5) {
            message += `• ועוד ${stats.achievements.length - 5} הישגים...\n`;
          }
        } else {
          message += `🎯 **הישגים:** עדיין אין הישגים, המשך להתאמן!\n`;
        }
      }
      
      // Add motivational message
      if (stats.total_points > 0) {
        message += `\n${getMotivationalMessage(stats.total_points)}`;
      }
      
      return {
        success: true,
        message,
        data: stats,
        ui_component: {
          type: 'stats_dashboard',
          props: {
            points: stats.total_points || 0,
            exercises: stats.total_exercises || 0,
            streak: stats.progress?.streak || 0,
            level: stats.progress?.level || 'מתחיל',
            achievements: stats.achievements || [],
            chartData: stats.chart_data || null
          }
        }
      };
    } catch (error) {
      console.error('Statistics retrieval error:', error);
      return {
        success: false,
        message: '❌ לא הצלחתי לטעון את הסטטיסטיקות. נסה שוב.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Translate exercise type to Hebrew
 */
function translateExerciseType(type: string): string {
  const translations: Record<string, string> = {
    'squat': 'סקוואטים',
    'pushup': 'שכיבות סמיכה',
    'pullup': 'משיכות',
    'burpee': 'ברפיז',
    'running': 'ריצה',
    'walking': 'הליכה',
    'cycling': 'אופניים',
    'strength': 'כוח',
    'cardio': 'אירובי',
    'flexibility': 'גמישות'
  };
  
  return translations[type.toLowerCase()] || type;
}

/**
 * Get motivational message based on points
 */
function getMotivationalMessage(points: number): string {
  if (points < 100) {
    return '💪 התחלה מצוינת! המשך כך!';
  } else if (points < 500) {
    return '🔥 אתה בדרך הנכונה! הכושר שלך משתפר!';
  } else if (points < 1000) {
    return '⭐ וואו! אתה ממש מתקדם! המשך להפתיע!';
  } else if (points < 5000) {
    return '🚀 אלוף! הביצועים שלך מרשימים!';
  } else {
    return '👑 אגדה! אתה השראה לכולם!';
  }
}