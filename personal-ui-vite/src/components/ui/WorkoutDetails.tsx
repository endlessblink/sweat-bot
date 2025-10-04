import React from 'react';

interface Exercise {
  id: string;
  name: string;
  hebrew_name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  duration?: number;
  points: number;
  timestamp: string;
  category?: string;
}

interface WorkoutDetailsProps {
  exercises: Exercise[];
  totalPoints?: number;
  period?: string;
}

/**
 * Structured workout details display component
 * Shows exercises in an organized table/card format
 */
export default function WorkoutDetails({ exercises, totalPoints, period = 'החודש' }: WorkoutDetailsProps) {
  if (!exercises || exercises.length === 0) {
    return (
      <div className="bg-neutral-900 rounded-lg p-4 text-center">
        <p className="text-neutral-400">אין אימונים להצגה {period}</p>
      </div>
    );
  }

  // Group exercises by date
  const exercisesByDate = exercises.reduce((acc, exercise) => {
    const date = new Date(exercise.timestamp).toLocaleDateString('he-IL', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  return (
    <div className="bg-neutral-900 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-2">
        <h3 className="text-lg font-semibold text-white mb-1">
          📊 פירוט אימונים {period}
        </h3>
        {totalPoints && (
          <p className="text-sm text-neutral-400">
            סה"כ נקודות: <span className="text-white font-bold">{totalPoints}</span>
          </p>
        )}
      </div>

      {/* Exercises grouped by date */}
      <div className="space-y-3">
        {Object.entries(exercisesByDate).map(([date, dayExercises]) => (
          <div key={date} className="space-y-2">
            <h4 className="text-sm font-medium text-neutral-300 sticky top-0 bg-neutral-900 py-1">
              {date}
            </h4>
            
            {/* Exercise cards for this date */}
            <div className="space-y-1.5">
              {dayExercises.map((exercise, idx) => (
                <div 
                  key={exercise.id || idx}
                  className="bg-neutral-800 rounded-md p-3 hover:bg-neutral-750 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Exercise name */}
                      <p className="text-white font-medium">
                        {exercise.hebrew_name || exercise.name}
                      </p>
                      
                      {/* Exercise details */}
                      <div className="flex gap-3 mt-1 text-sm text-neutral-400">
                        {exercise.sets && (
                          <span>{exercise.sets} סטים</span>
                        )}
                        {exercise.reps && (
                          <span>{exercise.reps} חזרות</span>
                        )}
                        {exercise.weight && (
                          <span>{exercise.weight} ק"ג</span>
                        )}
                        {exercise.distance && (
                          <span>{exercise.distance} ק"מ</span>
                        )}
                        {exercise.duration && (
                          <span>{exercise.duration} דקות</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Points */}
                    <div className="text-right">
                      <span className="text-green-400 font-bold">
                        +{exercise.points}
                      </span>
                      <p className="text-xs text-neutral-500">נקודות</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="border-t border-neutral-800 pt-3 mt-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold text-white">
              {exercises.length}
            </p>
            <p className="text-xs text-neutral-400">תרגילים</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">
              {Object.keys(exercisesByDate).length}
            </p>
            <p className="text-xs text-neutral-400">ימי אימון</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-400">
              {totalPoints || exercises.reduce((sum, ex) => sum + ex.points, 0)}
            </p>
            <p className="text-xs text-neutral-400">נקודות</p>
          </div>
        </div>
      </div>
    </div>
  );
}