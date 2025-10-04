import React from 'react';

interface WorkoutCardProps {
  data: {
    workout_name: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_time: number;
    estimated_points: number;
    exercises: Array<{
      name_hebrew: string;
      name_english: string;
      reps?: number;
      sets?: number;
      duration?: number;
    }>;
    description?: string;
  };
  onStartWorkout?: (workoutName: string) => void;
  onViewDetails?: () => void;
}

/**
 * Workout Card Component - Displays suggested workout with RTL support
 * Shows workout details and allows starting the workout
 */
export default function WorkoutCard({ data, onStartWorkout, onViewDetails }: WorkoutCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'text-green-400',
      intermediate: 'text-yellow-400',
      advanced: 'text-red-400'
    };
    return colors[difficulty as keyof typeof colors] || 'text-gray-400';
  };

  const getDifficultyText = (difficulty: string) => {
    const texts = {
      beginner: 'מתחיל',
      intermediate: 'בינוני',
      advanced: 'מתקדם'
    };
    return texts[difficulty as keyof typeof texts] || 'רגיל';
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 my-2 max-w-md mx-auto" style={{ direction: 'rtl' }}>
      {/* Workout Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-lg text-right mb-1">{data.workout_name}</h3>
          <div className="flex items-center gap-3 text-sm">
            <span className={`font-medium ${getDifficultyColor(data.difficulty)}`}>
              {getDifficultyText(data.difficulty)}
            </span>
            <span className="text-neutral-400">{data.estimated_time} דקות</span>
          </div>
        </div>
        <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ~{data.estimated_points} נק'
        </div>
      </div>

      {/* Description */}
      {data.description && (
        <p className="text-neutral-300 text-sm mb-3 text-right leading-relaxed">
          {data.description}
        </p>
      )}

      {/* Exercises List */}
      <div className="mb-4">
        <h4 className="text-white text-sm font-medium mb-2 text-right">תרגילים:</h4>
        <div className="space-y-2">
          {data.exercises.slice(0, 3).map((exercise, index) => (
            <div key={index} className="flex justify-between items-center bg-neutral-800 rounded p-2">
              <div className="text-right">
                <span className="text-white text-sm">{exercise.name_hebrew}</span>
                <div className="text-neutral-400 text-xs">
                  {exercise.reps && `${exercise.reps} חזרות`}
                  {exercise.sets && ` × ${exercise.sets} סטים`}
                  {exercise.duration && `${exercise.duration} שניות`}
                </div>
              </div>
            </div>
          ))}
          {data.exercises.length > 3 && (
            <div className="text-center text-neutral-400 text-sm">
              ועוד {data.exercises.length - 3} תרגילים...
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onStartWorkout && (
          <button
            onClick={() => onStartWorkout(data.workout_name)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md font-medium transition-colors"
          >
            🏋️‍♂️ התחל אימון
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-md font-medium transition-colors"
          >
            פרטים
          </button>
        )}
      </div>
    </div>
  );
}