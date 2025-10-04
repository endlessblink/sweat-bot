import React from 'react';

interface ExerciseCardProps {
  data: {
    exercise_name_hebrew: string;
    exercise_name_english: string;
    reps?: number;
    weight?: number;
    duration?: number;
    distance?: number;
    points_earned: number;
    timestamp: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Exercise Card Component - Displays logged exercise with RTL support
 * Shows exercise details, points earned, and action buttons
 */
export default function ExerciseCard({ data, onEdit, onDelete }: ExerciseCardProps) {
  const formatExerciseDetails = () => {
    const details = [];
    if (data.reps) details.push(`${data.reps} חזרות`);
    if (data.weight) details.push(`${data.weight} ק"ג`);
    if (data.duration) details.push(`${data.duration} דקות`);
    if (data.distance) details.push(`${data.distance} ק"מ`);
    return details.join(' • ');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 my-2 max-w-sm mx-auto" style={{ direction: 'rtl' }}>
      {/* Exercise Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white text-right">{data.exercise_name_hebrew}</h3>
          <p className="text-neutral-400 text-sm text-right">{data.exercise_name_english}</p>
        </div>
        <div className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          +{data.points_earned} נק'
        </div>
      </div>

      {/* Exercise Details */}
      {formatExerciseDetails() && (
        <div className="text-neutral-300 text-sm mb-3 text-right">
          {formatExerciseDetails()}
        </div>
      )}

      {/* Timestamp */}
      <div className="text-neutral-500 text-xs mb-3 text-right">
        {new Date(data.timestamp).toLocaleString('he-IL')}
      </div>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 justify-end">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-blue-400 hover:text-blue-300 text-sm px-2 py-1 rounded transition-colors"
            >
              ערוך
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded transition-colors"
            >
              מחק
            </button>
          )}
        </div>
      )}
    </div>
  );
}