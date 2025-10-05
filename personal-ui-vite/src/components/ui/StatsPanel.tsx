import React, { useEffect, useState } from 'react';

interface Exercise {
  id: number;
  name_he: string;
  reps: number;
  sets: number;
  points_earned: number;
  created_at: string;
}

interface Stats {
  total_points: number;
  weekly_points: number;
  monthly_points: number;
  total_exercises: number;
  recent_exercises: Exercise[];
  achievements: string[];
}

export default function StatsPanel({ onClose }: { onClose?: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Get authentication token
      const token = localStorage.getItem('guestToken') || 'default-guest-token';

      // Fetch real statistics from backend
      const response = await fetch('http://localhost:8000/exercises/statistics', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch statistics:', response.status, errorText);
        setError('שגיאה בטעינת הסטטיסטיקות');
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('שגיאה בטעינת הסטטיסטיקות');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black border border-neutral-800 rounded-lg p-6 text-white">
        <div className="text-center">טוען סטטיסטיקות...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black border border-red-800 rounded-lg p-6 text-red-400">
        <div className="text-center">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-black border border-neutral-800 rounded-lg p-6 text-white" style={{ direction: 'rtl' }}>
      {/* Header with close button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">📊 הסטטיסטיקות שלך</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Points Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-900 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{stats.total_points}</div>
          <div className="text-sm text-neutral-400">נקודות כולל</div>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.weekly_points}</div>
          <div className="text-sm text-neutral-400">השבוע</div>
        </div>
        <div className="bg-neutral-900 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.monthly_points}</div>
          <div className="text-sm text-neutral-400">החודש</div>
        </div>
      </div>

      {/* Recent Exercises */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">אימונים אחרונים</h3>
        <div className="space-y-2">
          {stats.recent_exercises.map(exercise => (
            <div key={exercise.id} className="bg-neutral-900 rounded-lg p-3 flex justify-between items-center">
              <div>
                <span className="font-medium">{exercise.name_he}</span>
                <span className="text-neutral-400 text-sm mr-2">
                  {exercise.sets > 1 ? `${exercise.sets}×${exercise.reps}` : `${exercise.reps} חזרות`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-400 text-sm">+{exercise.points_earned} נק׳</span>
                <span className="text-neutral-500 text-xs">{exercise.created_at}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {stats.achievements && stats.achievements.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">🏆 הישגים</h3>
          <div className="flex flex-wrap gap-2">
            {stats.achievements.map((achievement, idx) => (
              <span 
                key={idx}
                className="bg-yellow-900/30 text-yellow-400 px-3 py-1 rounded-full text-sm"
              >
                {achievement}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Chart (simplified) */}
      <div className="mt-6 pt-4 border-t border-neutral-800">
        <div className="text-sm text-neutral-400 text-center">
          סה״כ {stats.total_exercises} תרגילים החודש
        </div>
        <div className="mt-2 bg-neutral-900 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min((stats.weekly_points / 200) * 100, 100)}%` }}
          />
        </div>
        <div className="text-xs text-neutral-500 mt-1 text-center">
          {Math.round((stats.weekly_points / 200) * 100)}% מהיעד השבועי (200 נקודות)
        </div>
      </div>
    </div>
  );
}