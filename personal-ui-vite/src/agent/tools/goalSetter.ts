/**
 * Goal Setter Tool
 * Sets and tracks fitness goals for the user
 */

import { z } from 'zod';

const goalSetterSchema = z.object({
  action: z.enum(['set', 'get', 'update', 'complete', 'delete'])
    .default('set')
    .describe('Action to perform on goals'),
  goal_type: z.enum(['daily', 'weekly', 'monthly', 'custom'])
    .optional()
    .describe('Type of goal'),
  target: z.object({
    type: z.enum(['points', 'exercises', 'specific_exercise', 'distance', 'duration'])
      .describe('What to track'),
    value: z.number()
      .describe('Target value'),
    exercise: z.string()
      .optional()
      .describe('Specific exercise if applicable')
  }).optional(),
  goal_id: z.string()
    .optional()
    .describe('ID of existing goal for update/complete/delete'),
  description: z.string()
    .optional()
    .describe('Goal description')
});

export type GoalSetterParams = z.infer<typeof goalSetterSchema>;

export const goalSetterTool = {
  name: 'manage_goals',
  description: 'Set, track, and manage fitness goals',
  parameters: goalSetterSchema,
  
  execute: async (params: GoalSetterParams) => {
    try {
      let endpoint = '/api/v1/goals';
      let method = 'GET';
      let body: any = {};
      
      switch (params.action) {
        case 'set':
          method = 'POST';
          body = {
            type: params.goal_type,
            target: params.target,
            description: params.description
          };
          break;
          
        case 'get':
          method = 'GET';
          if (params.goal_id) {
            endpoint += `/${params.goal_id}`;
          }
          break;
          
        case 'update':
          if (!params.goal_id) {
            return {
              success: false,
              message: '❌ צריך לציין איזה יעד לעדכן'
            };
          }
          method = 'PUT';
          endpoint += `/${params.goal_id}`;
          body = {
            target: params.target,
            description: params.description
          };
          break;
          
        case 'complete':
          if (!params.goal_id) {
            return {
              success: false,
              message: '❌ צריך לציין איזה יעד הושלם'
            };
          }
          method = 'POST';
          endpoint += `/${params.goal_id}/complete`;
          break;
          
        case 'delete':
          if (!params.goal_id) {
            return {
              success: false,
              message: '❌ צריך לציין איזה יעד למחוק'
            };
          }
          method = 'DELETE';
          endpoint += `/${params.goal_id}`;
          break;
      }
      
      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`Goal operation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Build response message
      let message = '';
      
      switch (params.action) {
        case 'set':
          message = `🎯 יעד חדש נקבע!\n`;
          message += formatGoalDetails(result.goal);
          message += `\n\n💪 בהצלחה בהשגת היעד!`;
          break;
          
        case 'get':
          if (Array.isArray(result.goals)) {
            message = `📋 **היעדים שלך:**\n\n`;
            if (result.goals.length === 0) {
              message = `אין לך יעדים פעילים כרגע. רוצה להגדיר יעד חדש?`;
            } else {
              for (const goal of result.goals) {
                message += formatGoalDetails(goal) + '\n';
              }
            }
          } else {
            message = formatGoalDetails(result.goal);
          }
          break;
          
        case 'update':
          message = `✏️ היעד עודכן בהצלחה!\n`;
          message += formatGoalDetails(result.goal);
          break;
          
        case 'complete':
          message = `🎉 **כל הכבוד! השלמת את היעד!**\n\n`;
          message += formatGoalDetails(result.goal);
          if (result.reward) {
            message += `\n🏆 קיבלת ${result.reward.points} נקודות בונוס!`;
          }
          break;
          
        case 'delete':
          message = `🗑️ היעד נמחק.`;
          break;
      }
      
      return {
        success: true,
        message,
        data: result,
        ui_component: params.action === 'get' && Array.isArray(result.goals) ? {
          type: 'goals_list',
          props: {
            goals: result.goals,
            canEdit: true
          }
        } : params.action === 'set' || params.action === 'update' ? {
          type: 'goal_card',
          props: {
            goal: result.goal
          }
        } : undefined
      };
    } catch (error) {
      console.error('Goal management error:', error);
      return {
        success: false,
        message: `❌ לא הצלחתי לטפל ביעד: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Format goal details for display
 */
function formatGoalDetails(goal: any): string {
  let details = `• **${goal.description || getDefaultGoalDescription(goal)}**\n`;
  
  // Progress bar
  const progress = goal.current || 0;
  const target = goal.target?.value || 100;
  const percentage = Math.min(100, Math.round((progress / target) * 100));
  
  details += `  📊 התקדמות: ${progress}/${target} (${percentage}%)\n`;
  
  // Visual progress bar
  const barLength = 20;
  const filled = Math.round((percentage / 100) * barLength);
  const empty = barLength - filled;
  details += `  [${'█'.repeat(filled)}${'░'.repeat(empty)}]\n`;
  
  // Time remaining
  if (goal.deadline) {
    const remaining = getTimeRemaining(goal.deadline);
    details += `  ⏰ נותר: ${remaining}\n`;
  }
  
  // Status
  if (goal.completed) {
    details += `  ✅ הושלם!\n`;
  } else if (percentage >= 100) {
    details += `  🎯 מוכן להשלמה!\n`;
  }
  
  return details;
}

/**
 * Get default goal description
 */
function getDefaultGoalDescription(goal: any): string {
  if (!goal.target) return 'יעד כושר';
  
  const { type, value, exercise } = goal.target;
  
  switch (type) {
    case 'points':
      return `להגיע ל-${value} נקודות`;
    case 'exercises':
      return `לבצע ${value} תרגילים`;
    case 'specific_exercise':
      return `לבצע ${value} ${exercise || 'תרגילים'}`;
    case 'distance':
      return `לרוץ ${value} ק"מ`;
    case 'duration':
      return `להתאמן ${value} דקות`;
    default:
      return 'יעד כושר';
  }
}

/**
 * Get time remaining until deadline
 */
function getTimeRemaining(deadline: string): string {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target.getTime() - now.getTime();
  
  if (diff < 0) return 'פג תוקף';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days} ימים`;
  } else if (hours > 0) {
    return `${hours} שעות`;
  } else {
    return 'פחות משעה';
  }
}