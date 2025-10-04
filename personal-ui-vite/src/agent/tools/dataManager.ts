/**
 * Data Manager Tool
 * Manages user data including reset and clear operations with safety confirmations
 */

import { z } from 'zod';

const dataManagerSchema = z.object({
  action: z.enum(['reset_points', 'clear_exercises', 'clear_all', 'export', 'backup'])
    .describe('Action to perform on user data'),
  confirm: z.boolean()
    .default(false)
    .describe('Confirmation flag for destructive operations'),
  time_period: z.enum(['today', 'week', 'month', 'all'])
    .optional()
    .describe('Time period for data operations')
});

export type DataManagerParams = z.infer<typeof dataManagerSchema>;

export const dataManagerTool = {
  name: 'manage_data',
  description: 'Manage user fitness data including reset, clear, export, and backup operations',
  parameters: dataManagerSchema,
  
  execute: async (params: DataManagerParams) => {
    try {
      // Check if confirmation is required for destructive operations
      if (['reset_points', 'clear_exercises', 'clear_all'].includes(params.action) && !params.confirm) {
        return {
          success: false,
          message: `⚠️ **אזהרה:** פעולת ${getActionName(params.action)} תמחק נתונים לצמיתות!\n\nאתה בטוח? הגב עם "כן, אני בטוח" כדי להמשיך.`,
          requiresConfirmation: true,
          data: {
            action: params.action,
            confirmationRequired: true
          }
        };
      }
      
      let endpoint = '';
      let method = 'POST';
      let body: any = {};
      
      switch (params.action) {
        case 'reset_points':
          endpoint = '/api/v1/exercises/reset-points';
          method = 'POST';
          body = { period: params.time_period || 'all' };
          break;
          
        case 'clear_exercises':
          endpoint = '/api/v1/exercises/clear';
          method = 'DELETE';
          body = { period: params.time_period || 'all' };
          break;
          
        case 'clear_all':
          endpoint = '/api/v1/exercises/clear-all';
          method = 'DELETE';
          break;
          
        case 'export':
          endpoint = '/api/v1/exercises/export';
          method = 'GET';
          break;
          
        case 'backup':
          endpoint = '/api/v1/exercises/backup';
          method = 'POST';
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
        throw new Error(`Operation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Build success message
      let message = '';
      
      switch (params.action) {
        case 'reset_points':
          message = `✅ הנקודות אופסו בהצלחה! מתחילים מחדש עם 0 נקודות.`;
          break;
          
        case 'clear_exercises':
          message = `✅ היסטוריית התרגילים נמחקה${params.time_period ? ` עבור ${getTimePeriodName(params.time_period)}` : ''}.`;
          break;
          
        case 'clear_all':
          message = `✅ כל הנתונים נמחקו. אתה מתחיל מחדש לגמרי!`;
          break;
          
        case 'export':
          message = `📦 הנתונים יוצאו בהצלחה!`;
          if (result.download_url) {
            message += `\n[הורד קובץ](${result.download_url})`;
          }
          break;
          
        case 'backup':
          message = `💾 גיבוי נוצר בהצלחה!\nשם הקובץ: ${result.backup_file}`;
          break;
      }
      
      // Add fresh start encouragement for reset operations
      if (['reset_points', 'clear_exercises', 'clear_all'].includes(params.action)) {
        message += '\n\n🌟 התחלה חדשה! בהצלחה באימונים הבאים!';
      }
      
      return {
        success: true,
        message,
        data: result,
        ui_component: params.action === 'export' ? {
          type: 'download_link',
          props: {
            url: result.download_url,
            filename: result.filename,
            size: result.size
          }
        } : undefined
      };
    } catch (error) {
      console.error('Data management error:', error);
      return {
        success: false,
        message: `❌ הפעולה נכשלה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
};

/**
 * Get Hebrew action name
 */
function getActionName(action: string): string {
  const names: Record<string, string> = {
    'reset_points': 'איפוס נקודות',
    'clear_exercises': 'מחיקת תרגילים',
    'clear_all': 'מחיקת כל הנתונים',
    'export': 'ייצוא נתונים',
    'backup': 'גיבוי'
  };
  
  return names[action] || action;
}

/**
 * Get Hebrew time period name
 */
function getTimePeriodName(period: string): string {
  const names: Record<string, string> = {
    'today': 'היום',
    'week': 'השבוע',
    'month': 'החודש',
    'all': 'כל הזמן'
  };
  
  return names[period] || period;
}