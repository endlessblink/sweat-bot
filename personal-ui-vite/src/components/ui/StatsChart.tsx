import React from 'react';

interface StatsChartProps {
  data: {
    total_points: number;
    weekly_points: number;
    total_workouts: number;
    weekly_workouts: number;
    current_streak: number;
    weekly_goal?: number;
    recent_exercises?: Array<{
      date: string;
      points: number;
      exercises_count: number;
    }>;
  };
}

/**
 * Stats Chart Component - Displays fitness statistics and progress
 * Shows points, workout counts, streaks with visual elements
 */
export default function StatsChart({ data }: StatsChartProps) {
  const weeklyProgress = data.weekly_goal ? (data.weekly_points / data.weekly_goal) * 100 : 0;

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 my-2 max-w-md mx-auto" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-white font-semibold text-lg mb-1">הסטטיסטיקות שלי</h3>
        <p className="text-neutral-400 text-sm">המידע העדכני ביותר</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Points */}
        <div className="text-center p-3 bg-neutral-850 border border-neutral-700 rounded-lg">
          <div className="text-2xl font-bold text-teal-400 opacity-80">{data.total_points}</div>
          <div className="text-neutral-400 text-sm">נקודות סה"כ</div>
        </div>

        {/* Weekly Points */}
        <div className="text-center p-3 bg-neutral-850 border border-neutral-700 rounded-lg">
          <div className="text-2xl font-bold text-blue-400 opacity-70">{data.weekly_points}</div>
          <div className="text-neutral-400 text-sm">השבוע</div>
        </div>

        {/* Total Workouts */}
        <div className="text-center p-3 bg-neutral-850 border border-neutral-700 rounded-lg">
          <div className="text-2xl font-bold text-purple-400 opacity-60">{data.total_workouts}</div>
          <div className="text-neutral-400 text-sm">אימונים</div>
        </div>

        {/* Current Streak */}
        <div className="text-center p-3 bg-neutral-850 border border-neutral-700 rounded-lg">
          <div className="text-2xl font-bold text-amber-400 opacity-70">{data.current_streak}</div>
          <div className="text-neutral-400 text-sm">רצף ימים</div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      {data.weekly_goal && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-neutral-300 text-sm">יעד שבועי</span>
            <span className="text-neutral-300 text-sm">{data.weekly_points} / {data.weekly_goal}</span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-neutral-600 to-teal-600 opacity-70 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
            ></div>
          </div>
          <div className="text-center mt-1">
            <span className="text-neutral-400 text-xs">{weeklyProgress.toFixed(0)}% הושלם</span>
          </div>
        </div>
      )}

      {/* Recent Activity Visualization */}
      {data.recent_exercises && data.recent_exercises.length > 0 && (
        <div>
          <h4 className="text-white text-sm font-medium mb-2 text-right">פעילות אחרונה</h4>
          <div className="flex gap-1 justify-end">
            {data.recent_exercises.slice(-7).map((day, index) => (
              <div
                key={index}
                className="flex flex-col items-center"
              >
                <div
                  className="w-8 h-8 rounded bg-gradient-to-t from-neutral-800 to-green-600 opacity-75"
                  style={{ 
                    background: day.points > 0 
                      ? `linear-gradient(to top, #374151, #10b981 ${Math.min((day.points / 50) * 100, 100)}%)`
                      : '#374151'
                  }}
                  title={`${day.points} נקודות`}
                ></div>
                <span className="text-xs text-neutral-500 mt-1">
                  {new Date(day.date).toLocaleDateString('he-IL', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}