import React, { useEffect, useState } from 'react';
import { getOrCreateGuestToken } from '../../utils/auth';

interface ConversationSession {
  session_id: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  preview: string;
  metadata: any;
}

interface ChatHistorySidebarProps {
  onLoadSession: (sessionId: string) => void;
  onNewChat?: () => void;
  currentSessionId?: string;
  refreshTrigger?: number;
  onClose?: () => void;
}

interface GroupedSessions {
  today: ConversationSession[];
  yesterday: ConversationSession[];
  lastWeek: ConversationSession[];
  lastMonth: ConversationSession[];
  older: ConversationSession[];
}

export default function ChatHistorySidebar({ onLoadSession, onNewChat, currentSessionId, refreshTrigger, onClose }: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [refreshTrigger]);

  const fetchSessions = async () => {
    try {
      const token = await getOrCreateGuestToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/memory/sessions`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        setError('שגיאה בטעינת היסטוריה');
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('שגיאה בטעינת היסטוריה');
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDate = (sessions: ConversationSession[]): GroupedSessions => {
    const now = new Date();
    const groups: GroupedSessions = {
      today: [],
      yesterday: [],
      lastWeek: [],
      lastMonth: [],
      older: []
    };

    sessions.forEach(session => {
      const date = new Date(session.updated_at);
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups.today.push(session);
      else if (diffDays === 1) groups.yesterday.push(session);
      else if (diffDays <= 7) groups.lastWeek.push(session);
      else if (diffDays <= 30) groups.lastMonth.push(session);
      else groups.older.push(session);
    });

    return groups;
  };

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
    } else {
      // Default behavior: reload page
      window.location.reload();
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-neutral-950 border-l border-neutral-800 flex flex-col" style={{ direction: 'rtl' }}>
        <div className="flex items-center justify-between p-3 border-b border-neutral-800">
          <span className="text-sm text-neutral-400">היסטוריה</span>
          {onClose && (
            <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">✕</button>
          )}
        </div>
        <div className="p-4 text-neutral-500 text-sm text-center">טוען היסטוריה...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-neutral-950 border-l border-neutral-800 flex flex-col" style={{ direction: 'rtl' }}>
        <div className="flex items-center justify-between p-3 border-b border-neutral-800">
          <span className="text-sm text-neutral-400">היסטוריה</span>
          {onClose && (
            <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">✕</button>
          )}
        </div>
        <div className="p-4 text-red-400 text-sm text-center">{error}</div>
      </div>
    );
  }

  const grouped = groupSessionsByDate(sessions);

  const renderSessionGroup = (title: string, sessions: ConversationSession[]) => {
    if (sessions.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-neutral-600 px-3 mb-2">{title}</h4>
        <div className="space-y-1">
          {sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => onLoadSession(session.session_id)}
              className={`w-full text-right p-3 rounded-lg transition-colors ${
                currentSessionId === session.session_id
                  ? 'bg-neutral-800 border border-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 border border-transparent'
              }`}
            >
              <div className="text-sm text-white text-right truncate">
                {session.preview || 'שיחה'}
              </div>
              <div className="text-xs text-neutral-600 mt-1">
                {session.message_count} הודעות
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-64 bg-neutral-950 flex flex-col h-full" style={{ direction: 'rtl' }}>
      <div className="flex items-center justify-between p-3 border-b border-neutral-800">
        <span className="text-sm text-neutral-400">היסטוריה</span>
        {onClose && (
          <button onClick={onClose} className="text-neutral-500 hover:text-white text-sm">✕</button>
        )}
      </div>
      {/* New Chat Button */}
      <div className="p-3 border-b border-neutral-800">
        <button
          onClick={handleNewChat}
          className="w-full px-4 py-3 bg-white text-black hover:bg-neutral-200 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <span>+</span>
          <span>שיחה חדשה</span>
        </button>
      </div>

      {/* Session List with Grouping */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-sm">
            אין שיחות קודמות
          </div>
        ) : (
          <div>
            {renderSessionGroup('היום', grouped.today)}
            {renderSessionGroup('אתמול', grouped.yesterday)}
            {renderSessionGroup('שבוע שעבר', grouped.lastWeek)}
            {renderSessionGroup('חודש שעבר', grouped.lastMonth)}
            {renderSessionGroup('ישן יותר', grouped.older)}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-neutral-800">
        <button
          onClick={fetchSessions}
          className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm"
        >
          🔄 רענן
        </button>
      </div>
    </div>
  );
}
