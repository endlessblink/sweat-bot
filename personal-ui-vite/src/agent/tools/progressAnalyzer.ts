/**
 * Progress Analyzer Tool
 * Analyzes workout trends, patterns, and provides insights
 */

import { z } from 'zod';

const progressAnalyzerSchema = z.object({
  analysis_type: z.enum(['trends', 'patterns', 'comparison', 'predictions', 'insights', 'all'])
    .default('all')
    .describe('Type of analysis to perform'),
  time_period: z.enum(['week', 'month', 'quarter', 'year', 'all_time'])
    .default('month')
    .describe('Time period for analysis'),
  focus_area: z.enum(['strength', 'cardio', 'consistency', 'variety', 'all'])
    .optional()
    .describe('Specific area to focus on')
});

export type ProgressAnalyzerParams = z.infer<typeof progressAnalyzerSchema>;

export const progressAnalyzerTool = {
  name: 'analyze_progress',
  description: 'Analyze fitness progress, identify patterns, and provide personalized insights',
  parameters: progressAnalyzerSchema,
  
  execute: async (params: ProgressAnalyzerParams) => {
    try {
      const queryParams = new URLSearchParams({
        type: params.analysis_type,
        period: params.time_period,
        focus: params.focus_area || 'all'
      });
      
      const response = await fetch(
        `http://localhost:8000/api/v1/exercises/analyze?${queryParams}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }
      
      const analysis = await response.json();
      
      // Build comprehensive analysis message
      let message = `📊 **ניתוח התקדמות - ${getTimePeriodName(params.time_period)}**\n\n`;
      
      // Trends
      if (params.analysis_type === 'trends' || params.analysis_type === 'all') {
        message += `📈 **מגמות:**\n`;
        
        if (analysis.trends) {
          if (analysis.trends.points_trend) {
            const trend = analysis.trends.points_trend;
            const icon = trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→';
            message += `• נקודות: ${icon} ${Math.abs(trend)}% ${getTrendDescription(trend)}\n`;
          }
          
          if (analysis.trends.frequency_trend) {
            const trend = analysis.trends.frequency_trend;
            const icon = trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→';
            message += `• תדירות אימונים: ${icon} ${Math.abs(trend)}% ${getTrendDescription(trend)}\n`;
          }
          
          if (analysis.trends.intensity_trend) {
            const trend = analysis.trends.intensity_trend;
            const icon = trend > 0 ? '💪' : trend < 0 ? '😴' : '😊';
            message += `• עצימות: ${icon} ${getIntensityDescription(trend)}\n`;
          }
        }
        
        message += '\n';
      }
      
      // Patterns
      if (params.analysis_type === 'patterns' || params.analysis_type === 'all') {
        message += `🔍 **דפוסים שזיהיתי:**\n`;
        
        if (analysis.patterns) {
          if (analysis.patterns.best_day) {
            message += `• היום הכי טוב שלך: ${getDayName(analysis.patterns.best_day)}\n`;
          }
          
          if (analysis.patterns.best_time) {
            message += `• השעה הכי טובה: ${analysis.patterns.best_time}\n`;
          }
          
          if (analysis.patterns.favorite_exercises) {
            message += `• התרגילים האהובים: ${analysis.patterns.favorite_exercises.join(', ')}\n`;
          }
          
          if (analysis.patterns.consistency_score) {
            message += `• ציון עקביות: ${analysis.patterns.consistency_score}/10 ${getConsistencyEmoji(analysis.patterns.consistency_score)}\n`;
          }
        }
        
        message += '\n';
      }
      
      // Comparison
      if (params.analysis_type === 'comparison' || params.analysis_type === 'all') {
        if (analysis.comparison) {
          message += `📊 **השוואה לתקופה קודמת:**\n`;
          
          const comp = analysis.comparison;
          message += `• נקודות: ${comp.points_change > 0 ? '+' : ''}${comp.points_change}% ${getChangeEmoji(comp.points_change)}\n`;
          message += `• מספר אימונים: ${comp.workouts_change > 0 ? '+' : ''}${comp.workouts_change}% ${getChangeEmoji(comp.workouts_change)}\n`;
          message += `• גיוון תרגילים: ${comp.variety_change > 0 ? '+' : ''}${comp.variety_change}% ${getChangeEmoji(comp.variety_change)}\n`;
          
          message += '\n';
        }
      }
      
      // Predictions
      if (params.analysis_type === 'predictions' || params.analysis_type === 'all') {
        if (analysis.predictions) {
          message += `🔮 **תחזיות:**\n`;
          
          if (analysis.predictions.next_milestone) {
            message += `• אבן דרך הבאה: ${analysis.predictions.next_milestone.description}\n`;
            message += `  צפוי ב: ${analysis.predictions.next_milestone.estimated_date}\n`;
          }
          
          if (analysis.predictions.monthly_projection) {
            message += `• תחזית חודשית: ${analysis.predictions.monthly_projection} נקודות\n`;
          }
          
          if (analysis.predictions.goal_completion) {
            message += `• השלמת יעדים: ${analysis.predictions.goal_completion}% סיכוי\n`;
          }
          
          message += '\n';
        }
      }
      
      // Insights and Recommendations
      if (params.analysis_type === 'insights' || params.analysis_type === 'all') {
        message += `💡 **תובנות והמלצות:**\n`;
        
        if (analysis.insights && analysis.insights.length > 0) {
          for (const insight of analysis.insights) {
            message += `• ${insight}\n`;
          }
        } else {
          message += `• המשך באימונים הקבועים שלך!\n`;
          message += `• נסה להוסיף גיוון לתרגילים\n`;
          message += `• הגדר יעדים חדשים כדי להישאר ממוקד\n`;
        }
        
        message += '\n';
      }
      
      // Motivational closing
      message += getMotivationalClosing(analysis);
      
      return {
        success: true,
        message,
        data: analysis,
        ui_component: {
          type: 'progress_chart',
          props: {
            trends: analysis.trends,
            patterns: analysis.patterns,
            chartData: analysis.chart_data,
            insights: analysis.insights
          }
        }
      };
    } catch (error) {
      console.error('Progress analysis error:', error);
      return {
        success: false,
        message: '❌ לא הצלחתי לנתח את ההתקדמות. נסה שוב.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

function getTimePeriodName(period: string): string {
  const names: Record<string, string> = {
    'week': 'שבוע',
    'month': 'חודש',
    'quarter': 'רבעון',
    'year': 'שנה',
    'all_time': 'כל הזמן'
  };
  return names[period] || period;
}

function getTrendDescription(trend: number): string {
  if (trend > 20) return 'עלייה חדה';
  if (trend > 5) return 'עלייה';
  if (trend > -5) return 'יציב';
  if (trend > -20) return 'ירידה';
  return 'ירידה חדה';
}

function getIntensityDescription(trend: number): string {
  if (trend > 10) return 'עלייה משמעותית בעצימות';
  if (trend > 0) return 'עלייה קלה בעצימות';
  if (trend === 0) return 'עצימות יציבה';
  if (trend > -10) return 'ירידה קלה בעצימות';
  return 'ירידה בעצימות';
}

function getDayName(day: string): string {
  const days: Record<string, string> = {
    'Sunday': 'ראשון',
    'Monday': 'שני',
    'Tuesday': 'שלישי',
    'Wednesday': 'רביעי',
    'Thursday': 'חמישי',
    'Friday': 'שישי',
    'Saturday': 'שבת'
  };
  return days[day] || day;
}

function getConsistencyEmoji(score: number): string {
  if (score >= 9) return '🌟';
  if (score >= 7) return '⭐';
  if (score >= 5) return '👍';
  if (score >= 3) return '📈';
  return '💪';
}

function getChangeEmoji(change: number): string {
  if (change > 20) return '🚀';
  if (change > 10) return '📈';
  if (change > 0) return '↗️';
  if (change === 0) return '➡️';
  if (change > -10) return '↘️';
  return '📉';
}

function getMotivationalClosing(analysis: any): string {
  const score = analysis.overall_score || 50;
  
  if (score >= 90) {
    return '🏆 **אתה פשוט מדהים!** הביצועים שלך יוצאי דופן. המשך להוביל!';
  } else if (score >= 70) {
    return '⭐ **עבודה מצוינת!** אתה בדרך הנכונה להשגת היעדים שלך.';
  } else if (score >= 50) {
    return '💪 **התקדמות טובה!** תמשיך לדחוף קדימה, אתה מתקרב ליעד.';
  } else if (score >= 30) {
    return '🌱 **יש מקום לשיפור**, אבל כל אימון מקרב אותך למטרה!';
  } else {
    return '🔥 **הגיע הזמן להתחיל מחדש!** כל יום הוא הזדמנות חדשה.';
  }
}