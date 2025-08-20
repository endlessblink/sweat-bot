import React from 'react';

interface WorkoutData {
  date: string;
  workouts: number;
  points: number;
}

interface WorkoutHeatmapProps {
  data: WorkoutData[];
  months?: number;
}

export default function WorkoutHeatmap({ data, months = 3 }: WorkoutHeatmapProps) {
  const now = new Date();
  const totalDays = months * 30;
  
  // Create a grid of the last N days
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const workout = data.find(w => w.date === date.toISOString().split('T')[0]);
    
    return {
      date: date.toISOString().split('T')[0],
      workouts: workout?.workouts || 0,
      points: workout?.points || 0,
      dayOfWeek: date.getDay(),
      weekNumber: Math.floor(i / 7)
    };
  });
  
  const getIntensityColor = (workouts: number) => {
    if (workouts === 0) return 'bg-gray-700';
    if (workouts === 1) return 'bg-green-700';
    if (workouts === 2) return 'bg-green-600';
    return 'bg-green-500';
  };
  
  const weeks = Math.ceil(totalDays / 7);
  
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg">
      <div className="text-lg font-semibold mb-4">
        🔥 מפת אימונים - {months} חודשים אחרונים
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-xs mb-2">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
          <div key={day} className="text-center text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${weeks}, 1fr)` 
        }}
      >
        {days.reverse().map((day, index) => (
          <div
            key={day.date}
            className={`w-3 h-3 rounded-sm ${getIntensityColor(day.workouts)}`}
            title={`${day.date}: ${day.workouts} אימונים, ${day.points} נקודות`}
          />
        ))}
      </div>
      
      <div className="flex items-center justify-between mt-4 text-xs">
        <div className="text-muted-foreground">פחות</div>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-gray-700 rounded-sm" />
          <div className="w-2 h-2 bg-green-700 rounded-sm" />
          <div className="w-2 h-2 bg-green-600 rounded-sm" />
          <div className="w-2 h-2 bg-green-500 rounded-sm" />
        </div>
        <div className="text-muted-foreground">יותר</div>
      </div>
    </div>
  );
}