import React, { useEffect, useState } from 'react';
import { getUserPreferences, updateUserPreferences } from '../mastra/services/user-preferences';

interface PreferencesToggleProps {
  userId: string;
}

export function PreferencesToggle({ userId }: PreferencesToggleProps) {
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({
    avoidQuestions: false,
    responseStyle: 'balanced' as 'brief' | 'balanced' | 'detailed',
    showStatsAutomatically: false,
    encouragementLevel: 'moderate' as 'minimal' | 'moderate' | 'enthusiastic',
  });
  
  useEffect(() => {
    const loadPrefs = async () => {
      const userPrefs = await getUserPreferences(userId);
      setPrefs({
        avoidQuestions: userPrefs.avoidQuestions,
        responseStyle: userPrefs.responseStyle,
        showStatsAutomatically: userPrefs.showStatsAutomatically,
        encouragementLevel: userPrefs.encouragementLevel,
      });
    };
    loadPrefs();
  }, [userId]);
  
  const handlePrefChange = async (key: string, value: any) => {
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs);
    await updateUserPreferences(userId, { [key]: value });
  };
  
  return (
    <div className="mt-4">
      <button
        onClick={() => setShowPrefs(!showPrefs)}
        className="w-full text-right p-3 bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
      >
        <span className="flex items-center justify-between">
          <span>⚙️ העדפות אישיות</span>
          <span className="text-gray-400">{showPrefs ? '▼' : '▶'}</span>
        </span>
      </button>
      
      {showPrefs && (
        <div className="mt-2 p-4 bg-white rounded-lg shadow-lg space-y-4">
          {/* Avoid Questions Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              אני לא אוהב שאלות - רק תאשר ותמשיך
            </label>
            <input
              type="checkbox"
              checked={prefs.avoidQuestions}
              onChange={(e) => handlePrefChange('avoidQuestions', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
          
          {/* Response Style */}
          <div>
            <label className="text-sm font-medium block mb-2">סגנון תגובות:</label>
            <div className="flex gap-2">
              <button
                onClick={() => handlePrefChange('responseStyle', 'brief')}
                className={`px-3 py-1 rounded ${
                  prefs.responseStyle === 'brief' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                קצר
              </button>
              <button
                onClick={() => handlePrefChange('responseStyle', 'balanced')}
                className={`px-3 py-1 rounded ${
                  prefs.responseStyle === 'balanced' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                מאוזן
              </button>
              <button
                onClick={() => handlePrefChange('responseStyle', 'detailed')}
                className={`px-3 py-1 rounded ${
                  prefs.responseStyle === 'detailed' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                מפורט
              </button>
            </div>
          </div>
          
          {/* Encouragement Level */}
          <div>
            <label className="text-sm font-medium block mb-2">רמת עידוד:</label>
            <div className="flex gap-2">
              <button
                onClick={() => handlePrefChange('encouragementLevel', 'minimal')}
                className={`px-3 py-1 rounded ${
                  prefs.encouragementLevel === 'minimal' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                מינימלי
              </button>
              <button
                onClick={() => handlePrefChange('encouragementLevel', 'moderate')}
                className={`px-3 py-1 rounded ${
                  prefs.encouragementLevel === 'moderate' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                בינוני
              </button>
              <button
                onClick={() => handlePrefChange('encouragementLevel', 'enthusiastic')}
                className={`px-3 py-1 rounded ${
                  prefs.encouragementLevel === 'enthusiastic' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200'
                }`}
              >
                נלהב
              </button>
            </div>
          </div>
          
          {/* Auto Stats */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              הצג סטטיסטיקות אוטומטית
            </label>
            <input
              type="checkbox"
              checked={prefs.showStatsAutomatically}
              onChange={(e) => handlePrefChange('showStatsAutomatically', e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
          
          {/* Status indicator */}
          <div className="pt-2 border-t text-xs text-gray-500">
            {prefs.avoidQuestions ? (
              <span className="text-green-600">✓ מצב "בלי שאלות" פעיל</span>
            ) : (
              <span>המערכת תלמד את ההעדפות שלך</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}