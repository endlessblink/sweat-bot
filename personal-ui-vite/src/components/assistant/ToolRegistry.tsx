import React from 'react';
import PointsChart from '../visualizations/PointsChart';
import WorkoutHeatmap from '../visualizations/WorkoutHeatmap';
import { MultiProgressBar } from '../visualizations/ProgressBar';
import RTLProvider, { HebrewText } from '../RTLProvider';

/**
 * Tool Registry for SweatBot Visualizations
 * 
 * Maps tool names to their React components for rendering
 * in the chat interface as part of assistant responses
 */

export interface ToolProps {
  [key: string]: any;
}

// Sample data generators for when real data isn't available
const generateSamplePointsData = () => ({
  total: Math.floor(Math.random() * 2000) + 500,
  weekly: Array.from({ length: 7 }, () => Math.floor(Math.random() * 300) + 50),
  trend: Math.random() > 0.5 ? 'up' : 'down' as const,
  goal: 200
});

const generateSampleWorkoutData = (days = 90) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    if (Math.random() < 0.6) { // 60% chance of workout
      return {
        date: date.toISOString().split('T')[0],
        workouts: Math.floor(Math.random() * 3) + 1,
        points: Math.floor(Math.random() * 200) + 100
      };
    }
    return null;
  }).filter(Boolean) as Array<{ date: string; workouts: number; points: number }>;
};

const generateSampleGoalsData = () => [
  {
    label: 'אימוני כוח',
    current: Math.floor(Math.random() * 5),
    target: 4,
    unit: 'אימונים',
    color: 'primary' as const
  },
  {
    label: 'אימוני קרדיו', 
    current: Math.floor(Math.random() * 4),
    target: 3,
    unit: 'אימונים',
    color: 'success' as const
  },
  {
    label: 'נקודות יומיות',
    current: Math.floor(Math.random() * 250) + 100,
    target: 200,
    unit: 'נקודות',
    color: 'warning' as const
  }
];

// Tool component wrappers with Hebrew support
const ShowPointsTool: React.FC<ToolProps> = ({ data, type = 'line', title }) => {
  const pointsData = data || generateSamplePointsData();
  
  return (
    <RTLProvider>
      <div className="my-4 p-4 bg-card/50 rounded-lg border">
        <HebrewText>
          <h3 className="text-lg font-semibold mb-2 text-primary">
            📊 {title || 'הנקודות שלך השבוע'}
          </h3>
        </HebrewText>
        <PointsChart data={pointsData} type={type} />
        
        <RTLProvider>
          <div className="mt-2 text-sm text-muted-foreground">
            <HebrewText>
              סך הנקודות: {pointsData.total.toLocaleString()} | 
              יעד יומי: {pointsData.goal} נקודות
            </HebrewText>
          </div>
        </RTLProvider>
      </div>
    </RTLProvider>
  );
};

const ShowWorkoutHistoryTool: React.FC<ToolProps> = ({ data, months = 3, title }) => {
  const workoutData = data || generateSampleWorkoutData(months * 30);
  
  return (
    <RTLProvider>
      <div className="my-4 p-4 bg-card/50 rounded-lg border">
        <HebrewText>
          <h3 className="text-lg font-semibold mb-2 text-primary">
            🔥 {title || `מפת האימונים - ${months} חודשים אחרונים`}
          </h3>
        </HebrewText>
        <WorkoutHeatmap data={workoutData} months={months} />
        
        <RTLProvider>
          <div className="mt-2 text-sm text-muted-foreground">
            <HebrewText>
              סך אימונים: {workoutData.length} | 
              ממוצע שבועי: {Math.round(workoutData.length / (months * 4.3))} אימונים
            </HebrewText>
          </div>
        </RTLProvider>
      </div>
    </RTLProvider>
  );
};

const ShowGoalsProgressTool: React.FC<ToolProps> = ({ data, title }) => {
  const goalsData = data || generateSampleGoalsData();
  
  return (
    <RTLProvider>
      <div className="my-4 p-4 bg-card/50 rounded-lg border">
        <HebrewText>
          <h3 className="text-lg font-semibold mb-2 text-primary">
            🎯 {title || 'התקדמות לקראת היעדים השבועיים'}
          </h3>
        </HebrewText>
        <MultiProgressBar data={goalsData} />
        
        <RTLProvider>
          <div className="mt-2 text-sm text-muted-foreground">
            <HebrewText>
              {goalsData.filter(goal => goal.current >= goal.target).length} מתוך {goalsData.length} יעדים הושגו השבוע
            </HebrewText>
          </div>
        </RTLProvider>
      </div>
    </RTLProvider>
  );
};

const ShowStatsTool: React.FC<ToolProps> = ({ data, title }) => {
  const pointsData = data?.points || generateSamplePointsData();
  const workoutData = data?.workouts || generateSampleWorkoutData(30);
  const goalsData = data?.goals || generateSampleGoalsData();
  
  return (
    <RTLProvider>
      <div className="my-4 p-4 bg-card/50 rounded-lg border">
        <HebrewText>
          <h3 className="text-lg font-semibold mb-4 text-primary">
            📈 {title || 'הסטטיסטיקות המלאות שלך'}
          </h3>
        </HebrewText>
        
        <div className="space-y-6">
          {/* Points Overview */}
          <div>
            <HebrewText className="text-sm font-medium mb-2 text-foreground">
              נקודות השבוע
            </HebrewText>
            <PointsChart data={pointsData} type="line" />
          </div>
          
          {/* Goals Progress */}
          <div>
            <HebrewText className="text-sm font-medium mb-2 text-foreground">
              יעדים שבועיים
            </HebrewText>
            <MultiProgressBar data={goalsData} />
          </div>
          
          {/* Recent Activity */}
          <div>
            <HebrewText className="text-sm font-medium mb-2 text-foreground">
              פעילות אחרונה (30 יום)
            </HebrewText>
            <WorkoutHeatmap data={workoutData} months={1} />
          </div>
          
          {/* Summary Stats */}
          <RTLProvider>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-blue-500/10 p-3 rounded text-center">
                <HebrewText>
                  <div className="text-2xl font-bold text-blue-400">
                    {pointsData.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">נקודות השבוע</div>
                </HebrewText>
              </div>
              <div className="bg-green-500/10 p-3 rounded text-center">
                <HebrewText>
                  <div className="text-2xl font-bold text-green-400">
                    {workoutData.length}
                  </div>
                  <div className="text-xs text-muted-foreground">אימונים החודש</div>
                </HebrewText>
              </div>
            </div>
          </RTLProvider>
        </div>
      </div>
    </RTLProvider>
  );
};

// Tool registry mapping
export const TOOL_REGISTRY = {
  show_points: ShowPointsTool,
  showPoints: ShowPointsTool, // Alternative naming
  show_workout_history: ShowWorkoutHistoryTool,
  showWorkoutHistory: ShowWorkoutHistoryTool,
  show_goals_progress: ShowGoalsProgressTool,
  showGoalsProgress: ShowGoalsProgressTool,
  show_stats: ShowStatsTool,
  showStats: ShowStatsTool,
} as const;

// Helper to render tools
export const renderTool = (toolName: string, props: ToolProps = {}) => {
  const ToolComponent = TOOL_REGISTRY[toolName as keyof typeof TOOL_REGISTRY];
  
  if (!ToolComponent) {
    return (
      <RTLProvider>
        <div className="my-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <HebrewText className="text-red-400">
            🔧 כלי לא ידוע: {toolName}
          </HebrewText>
        </div>
      </RTLProvider>
    );
  }
  
  return <ToolComponent key={`tool-${toolName}-${Date.now()}`} {...props} />;
};

// Export individual tools for direct use
export {
  ShowPointsTool,
  ShowWorkoutHistoryTool, 
  ShowGoalsProgressTool,
  ShowStatsTool
};