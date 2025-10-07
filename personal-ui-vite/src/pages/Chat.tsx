import React from 'react';
import { useNavigate } from 'react-router-dom';
import SweatBotChat from '../components/SweatBotChat';
import { getUsername, isGuestUser, clearAuth } from '../utils/auth';

/**
 * Clean Chat Page - Minimal shadcn-style design
 * Now serves as the main page at root route
 */
export default function Chat() {
  const navigate = useNavigate();
  const username = getUsername();
  const isGuest = isGuestUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="py-6">
          <div className="text-center relative">
            <h1 className="text-xl font-semibold text-white mb-2">
              SweatBot
            </h1>
            <p className="text-neutral-400 text-sm">
              המאמן הכושר הדיגיטלי שלך
            </p>
            
            {/* Login/Logout button in top right */}
            <div className="absolute top-0 right-0">
              {isGuest ? (
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-white text-black rounded-md hover:bg-neutral-200 transition-colors text-sm font-medium"
                >
                  🔐 כניסה
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-sm">{username}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm"
                  >
                    יציאה
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          <SweatBotChat />
        </div>
      </div>
    </div>
  );
}
