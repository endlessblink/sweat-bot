import React, { useEffect, useState } from 'react';
import { calculateUserStats } from '../mastra/tools/exercise-logger';

interface StatsPanelProps {
  userId: string;
  show: boolean;
}

export function StatsPanel({ userId, show }: StatsPanelProps) {
  const [stats, setStats] = useState({
    totalExercises: 0,
    totalPoints: 0,
    totalCalories: 0,
    streak: 0,
    favoriteExercise: 'אין עדיין',
  });
  
  useEffect(() => {
    const loadStats = async () => {
      const userStats = await calculateUserStats(userId);
      setStats(userStats);
    };
    
    if (show) {
      loadStats();
      // Refresh every 30 seconds
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, show]);
  
  if (!show) return null;
  
  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h2 className="text-xl font-bold mb-4 text-right">📊 הסטטיסטיקות שלך</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalExercises}</div>
          <div className="text-sm text-gray-600">תרגילים</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalPoints}</div>
          <div className="text-sm text-gray-600">נקודות</div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.totalCalories}</div>
          <div className="text-sm text-gray-600">קלוריות</div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.streak}</div>
          <div className="text-sm text-gray-600">ימי רצף</div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">התרגיל האהוב עליך:</div>
        <div className="text-lg font-semibold">{stats.favoriteExercise}</div>
      </div>
      
      {/* Achievement badges */}
      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2">הישגים:</div>
        <div className="flex gap-2 flex-wrap">
          {stats.totalExercises >= 10 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
              🏅 10 תרגילים
            </span>
          )}
          {stats.totalPoints >= 100 && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
              ⭐ 100 נקודות
            </span>
          )}
          {stats.streak >= 3 && (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              🔥 רצף 3 ימים
            </span>
          )}
        </div>
      </div>
    </div>
  );
}