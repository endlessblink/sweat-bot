import React from 'react';

interface PointsData {
  total: number;
  weekly: number[];
  trend: 'up' | 'down';
  goal: number;
}

interface PointsChartProps {
  data: PointsData;
  type?: 'line' | 'bar';
}

export default function PointsChart({ data, type = 'line' }: PointsChartProps) {
  const { weekly, goal, trend } = data;
  const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">
          {trend === 'up' ? '📈' : '📉'} נקודות יומיות
        </div>
        <div className="text-sm text-muted-foreground">
          יעד: {goal} נקודות ליום
        </div>
      </div>
      
      <div className="flex items-end justify-between h-32 gap-2">
        {weekly.map((points, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className={`w-full rounded-t transition-all duration-300 ${
                points >= goal ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ 
                height: `${Math.max((points / Math.max(...weekly)) * 100, 10)}%` 
              }}
            />
            <div className="text-xs mt-1 text-muted-foreground">{days[index]}</div>
            <div className="text-xs font-semibold">{points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}