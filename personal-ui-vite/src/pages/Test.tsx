import React, { useState } from 'react';
import AssistantChat from '../components/assistant/AssistantChat';
import RTLProvider, { HebrewText } from '../components/RTLProvider';
import { renderTool } from '../components/assistant/ToolRegistry';
import { Link } from 'react-router-dom';

export default function Test() {
  const [selectedTool, setSelectedTool] = useState<string>('');

  const testTools = [
    { name: 'show_points', label: 'גרף נקודות' },
    { name: 'show_workout_history', label: 'מפת אימונים' },
    { name: 'show_goals_progress', label: 'התקדמות יעדים' },
    { name: 'show_stats', label: 'סטטיסטיקות מלאות' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="container mx-auto max-w-6xl">
        <header className="text-center py-8">
          <Link to="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← חזרה לדף הבית
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            🧪 AssistantChat + Hebrew + Tools Test
          </h1>
          <RTLProvider>
            <HebrewText>
              <p className="text-gray-300 text-lg">
                בדיקת אינטגרציה מלאה של Assistant-UI עם עברית וכלים חזותיים
              </p>
            </HebrewText>
          </RTLProvider>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <section className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <RTLProvider>
              <HebrewText>
                <h2 className="text-2xl font-bold text-white mb-4">
                  💬 ממשק הצ'אט החדש
                </h2>
                <p className="text-gray-300 mb-4">
                  נסה לכתוב: "הראה לי את הנקודות שלי" או "מה האימונים שלי"
                </p>
              </HebrewText>
            </RTLProvider>
            
            <AssistantChat />
          </section>

          {/* Tool Testing */}
          <section className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 shadow-2xl">
            <RTLProvider>
              <HebrewText>
                <h2 className="text-2xl font-bold text-white mb-4">
                  🔧 בדיקת כלים חזותיים
                </h2>
              </HebrewText>
            </RTLProvider>
            
            <div className="space-y-4">
              <RTLProvider>
                <select 
                  value={selectedTool}
                  onChange={(e) => setSelectedTool(e.target.value)}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600"
                  style={{ direction: 'rtl' }}
                >
                  <option value="">בחר כלי לבדיקה</option>
                  {testTools.map(tool => (
                    <option key={tool.name} value={tool.name}>
                      {tool.label}
                    </option>
                  ))}
                </select>
              </RTLProvider>

              {selectedTool && (
                <div className="border-t border-gray-600 pt-4">
                  {renderTool(selectedTool, { title: `בדיקה: ${testTools.find(t => t.name === selectedTool)?.label}` })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Status & Debugging */}
        <section className="mt-8 bg-blue-800/20 backdrop-blur-sm rounded-2xl border border-blue-700/50 p-6 shadow-2xl">
          <RTLProvider>
            <HebrewText>
              <h2 className="text-2xl font-bold text-white mb-4">
                🔍 מצב המערכת
              </h2>
            </HebrewText>
          </RTLProvider>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-900/30 p-4 rounded-lg border border-green-700/30">
              <RTLProvider>
                <HebrewText>
                  <h3 className="font-semibold mb-2 text-green-400">✅ רכיבים פעילים</h3>
                  <ul className="text-sm space-y-1 text-green-100">
                    <li>• Assistant-UI Runtime</li>
                    <li>• Hebrew RTL Support</li>
                    <li>• Tool Registry System</li>
                    <li>• Vite Hot Reload ⚡</li>
                  </ul>
                </HebrewText>
              </RTLProvider>
            </div>

            <div className="bg-yellow-900/30 p-4 rounded-lg border border-yellow-700/30">
              <RTLProvider>
                <HebrewText>
                  <h3 className="font-semibold mb-2 text-yellow-400">⚠️ הגדרות</h3>
                  <ul className="text-sm space-y-1 text-yellow-100">
                    <li>• API: {import.meta.env.VITE_API_URL || 'localhost:8000'}</li>
                    <li>• Debug: {import.meta.env.DEV ? 'פעיל' : 'כבוי'}</li>
                    <li>• Framework: Vite</li>
                  </ul>
                </HebrewText>
              </RTLProvider>
            </div>

            <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-700/30">
              <RTLProvider>
                <HebrewText>
                  <h3 className="font-semibold mb-2 text-blue-400">📋 הוראות בדיקה</h3>
                  <ul className="text-sm space-y-1 text-blue-100">
                    <li>• כתוב הודעות בעברית</li>
                    <li>• בחר כלים מהתפריט</li>
                    <li>• בדוק כיוון RTL</li>
                    <li>• נסה פקודות קול (עתיד)</li>
                  </ul>
                </HebrewText>
              </RTLProvider>
            </div>
          </div>
        </section>

        <footer className="text-center py-8">
          <div className="text-gray-500 text-sm">
            🧪 Test Environment | Assistant-UI v0.10.43 | Hebrew Support Active | Vite Build
          </div>
        </footer>
      </div>
    </div>
  );
}