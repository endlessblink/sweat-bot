import React from 'react';
import { Link } from 'react-router-dom';
import SweatBotChat from '../components/SweatBotChat';

/**
 * Main Chat Page - SweatBot Custom Implementation
 */
export default function Chat() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="text-center py-8">
          <Link to="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">
            💪 SweatBot Chat
          </h1>
          <p className="text-gray-300 text-lg">
            המאמן הכושר הדיגיטלי שלך עם תמיכה מלאה בעברית וקול
          </p>
        </header>

        <div className="max-w-2xl mx-auto">
          <SweatBotChat />
        </div>

        <footer className="text-center py-8">
          <div className="text-gray-500 text-sm">
            SweatBot v2.0 | Custom Built | Hebrew Voice Support | Multi-Agent AI
          </div>
        </footer>
      </div>
    </div>
  );
}