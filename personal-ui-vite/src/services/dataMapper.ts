/**
 * Data Mapper Service
 * Maps backend response data to frontend UI component props
 */

export interface BackendResponse {
  response: string;
  session_id: string;
  timestamp: string;
  ui_components?: UIComponentBackend[];
  tool_called?: string;
  tool_result?: any;
}

export interface UIComponentBackend {
  type: string;
  data: any;
  actions?: any[];
}

export interface UIComponentFrontend {
  type: 'exercise-card' | 'stats-chart' | 'quick-actions' | 'workout-card' | 'progress-bar' | 'achievement';
  data: any;
  actions?: Array<{
    label: string;
    action: string;
    params?: any;
  }>;
}

export class DataMapper {
  
  /**
   * Map backend UI component to frontend format
   */
  static mapUIComponent(backendComponent: UIComponentBackend): UIComponentFrontend {
    const { type, data, actions } = backendComponent;
    
    switch (type) {
      case 'stats-chart':
        return {
          type: 'stats-chart',
          data: {
            total_points: data.total_points || 0,
            weekly_points: data.weekly_points || 0,
            total_workouts: data.total_workouts || 0,
            weekly_workouts: data.weekly_workouts || 0,
            current_streak: data.current_streak || 0,
            weekly_goal: data.weekly_goal || 100,
            recent_exercises: data.recent_exercises || []
          }
        };
        
      case 'quick-actions':
        return {
          type: 'quick-actions',
          data: {
            actions: data.actions?.map((action: any) => ({
              label: action.label || 'פעולה',
              message: action.message || action.label,
              icon: action.icon || '⚡',
              variant: action.variant || 'secondary'
            })) || []
          }
        };
        
      case 'exercise-card':
        return {
          type: 'exercise-card',
          data: {
            exercise_name: data.exercise_name || 'תרגיל',
            exercise_name_hebrew: data.exercise_name_hebrew || data.exercise_name,
            reps: data.reps || 1,
            points_earned: data.points_earned || 10,
            timestamp: data.timestamp || new Date().toISOString(),
            exercise_type: data.exercise_type || 'strength'
          }
        };
        
      case 'workout-card':
        return {
          type: 'workout-card',
          data: {
            workout_name: data.workout_name || 'אימון מותאם אישית',
            exercises: data.exercises || [],
            estimated_duration: data.estimated_duration || '15-20 דקות',
            difficulty: data.difficulty || 'בינוני',
            target_muscles: data.target_muscles || ['כלל הגוף']
          }
        };
        
      default:
        console.warn(`Unknown UI component type: ${type}`);
        return {
          type: 'quick-actions',
          data: { actions: [] }
        };
    }
  }
  
  /**
   * Map complete backend response to frontend format
   */
  static mapBackendResponse(backendResponse: BackendResponse) {
    const mappedUIComponents = backendResponse.ui_components?.map(component =>
      this.mapUIComponent(component)
    ) || [];
    
    return {
      response: backendResponse.response,
      session_id: backendResponse.session_id,
      timestamp: new Date(backendResponse.timestamp),
      ui_components: mappedUIComponents,
      tool_called: backendResponse.tool_called,
      tool_result: backendResponse.tool_result
    };
  }
  
  /**
   * Validate UI component data
   */
  static validateComponentData(component: UIComponentFrontend): boolean {
    try {
      switch (component.type) {
        case 'stats-chart':
          return typeof component.data.total_points === 'number' &&
                 typeof component.data.total_workouts === 'number';
                 
        case 'quick-actions':
          return Array.isArray(component.data.actions) &&
                 component.data.actions.every((action: any) => 
                   typeof action.label === 'string' && typeof action.message === 'string'
                 );
                 
        case 'exercise-card':
          return typeof component.data.exercise_name === 'string' &&
                 typeof component.data.points_earned === 'number';
                 
        case 'workout-card':
          return typeof component.data.workout_name === 'string' &&
                 Array.isArray(component.data.exercises);
                 
        default:
          return false;
      }
    } catch (error) {
      console.error('Data validation error:', error);
      return false;
    }
  }
  
  /**
   * Create fallback UI component for errors
   */
  static createErrorFallback(): UIComponentFrontend {
    return {
      type: 'quick-actions',
      data: {
        actions: [
          {
            label: 'נסה שוב',
            message: 'נסה שוב',
            icon: '🔄',
            variant: 'secondary'
          },
          {
            label: 'עזרה',
            message: 'איך אתה יכול לעזור לי?',
            icon: '❓',
            variant: 'secondary'
          }
        ]
      }
    };
  }
  
  /**
   * Get default data for component type (for demo purposes)
   */
  static getDefaultComponentData(type: string) {
    switch (type) {
      case 'stats-chart':
        return {
          total_points: 0,
          weekly_points: 0,
          total_workouts: 0,
          weekly_workouts: 0,
          current_streak: 0,
          weekly_goal: 100,
          recent_exercises: []
        };
        
      case 'quick-actions':
        return {
          actions: [
            { label: 'רשום אימון', message: 'אני רוצה לרשום אימון', icon: '🏋️‍♂️', variant: 'primary' },
            { label: 'הצג נקודות', message: 'כמה נקודות יש לי?', icon: '📊', variant: 'secondary' }
          ]
        };
        
      case 'exercise-card':
        return {
          exercise_name: 'תרגיל חדש',
          exercise_name_hebrew: 'תרגיל חדש',
          reps: 1,
          points_earned: 10,
          timestamp: new Date().toISOString(),
          exercise_type: 'strength'
        };
        
      case 'workout-card':
        return {
          workout_name: 'אימון בסיסי',
          exercises: [
            { name: 'סקוואטים', reps: 10, sets: 3 }
          ],
          estimated_duration: '10-15 דקות',
          difficulty: 'קל',
          target_muscles: ['רגליים']
        };
        
      default:
        return {};
    }
  }
}

export default DataMapper;