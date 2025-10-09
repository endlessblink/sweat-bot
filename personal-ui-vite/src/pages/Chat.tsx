import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SweatBotChat from '../components/SweatBotChat';
import ChatHistorySidebar from '../components/ui/ChatHistorySidebar';
import StatsPanel from '../components/ui/StatsPanel';
import { getUsername, isGuestUser, clearAuth, getUserRole } from '../utils/auth';

/**
 * Classic Chat Layout - ChatGPT-style design
 * - Left sidebar: Conversation history
 * - Center: Full-width chat
 * - Top header: Login, statistics, etc.
 * - Fully responsive mobile/desktop
 */
export default function Chat() {
  const navigate = useNavigate();
  const username = getUsername();
  const isGuest = isGuestUser();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [sessionToLoad, setSessionToLoad] = useState<string | null>(null);
  const [clearChatFn, setClearChatFn] = useState<(() => void) | null>(null);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleLoadSession = (sessionId: string) => {
    setSessionToLoad(sessionId);
    setMobileMenuOpen(false);
  };

  const handleNewChat = () => {
    setSessionToLoad(null);
    if (clearChatFn) {
      clearChatFn();
    }
    setMobileMenuOpen(false);
  };

  const statsPanelControl = useMemo(() => ({
    isOpen: statsOpen,
    setIsOpen: setStatsOpen
  }), [statsOpen]);

const userRole = getUserRole();

  return (
    <div className="flex h-screen bg-black overflow-hidden">
      {/* Desktop Sidebar - Conversation History */}
      <div className={`hidden md:flex md:flex-col bg-neutral-950 border-r border-neutral-800 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'}`}>
        {sidebarOpen && (
          <ChatHistorySidebar
            onLoadSession={handleLoadSession}
            onNewChat={handleNewChat}
            currentSessionId={sessionToLoad || undefined}
          />
        )}
      </div>

      {/* Mobile Sidebar - Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex">
          <div className="w-64 bg-neutral-950">
            <ChatHistorySidebar
              onLoadSession={handleLoadSession}
              onNewChat={handleNewChat}
              currentSessionId={sessionToLoad || undefined}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-neutral-800 rounded transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block p-2 hover:bg-neutral-800 rounded transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>

            {/* Title */}
            <div>
              <h1 className="text-lg font-semibold text-white">SweatBot</h1>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Points Management Button */}
            {userRole === 'admin' && (
              <button
                onClick={() => navigate('/points')}
                className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors text-sm flex items-center gap-2"
                title="ניהול נקודות"
              >
                <span>🏆</span>
                <span className="hidden sm:inline">נקודות</span>
              </button>
            )}

            {/* Points Test Button */}
            <button
              onClick={() => navigate('/points-test')}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              title="בדיקת נקודות"
            >
              <span>🧮</span>
              <span className="hidden sm:inline">בדיקה</span>
            </button>

            {/* Statistics Button */}
            <button
              onClick={() => setStatsOpen(true)}
              className="px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm flex items-center gap-2"
              title="סטטיסטיקות"
            >
              <span>📊</span>
              <span className="hidden sm:inline">סטטיסטיקות</span>
            </button>

            {/* Login/Logout */}
            {isGuest ? (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-2 bg-white text-black rounded hover:bg-neutral-200 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>🔐</span>
                <span className="hidden sm:inline">כניסה</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 text-sm hidden sm:inline">{username}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm"
                >
                  יציאה
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Chat Area - Full Width */}
        <div className="flex-1 overflow-hidden">
          <SweatBotChat
            hideHeader
            sessionToLoad={sessionToLoad}
            onRegisterClearChat={(fn) => setClearChatFn(() => fn)}
            statsPanelControl={statsPanelControl}
          />
        </div>
      </div>

      {/* Statistics Panel - Modal Overlay */}
      {statsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-neutral-950 rounded-lg border border-neutral-800 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">📊 סטטיסטיקות</h2>
              <button
                onClick={() => setStatsOpen(false)}
                className="text-neutral-500 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <StatsPanel onClose={() => setStatsOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
