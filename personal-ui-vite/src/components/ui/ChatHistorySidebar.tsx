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
  currentSessionId?: string;
}

export default function ChatHistorySidebar({ onLoadSession, currentSessionId }: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'היום';
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;

    return date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="w-64 bg-neutral-950 border-l border-neutral-800 p-4">
        <div className="text-neutral-500 text-sm text-center">טוען היסטוריה...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-neutral-950 border-l border-neutral-800 p-4">
        <div className="text-red-400 text-sm text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-neutral-950 border-l border-neutral-800 flex flex-col h-full" style={{ direction: 'rtl' }}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <h3 className="text-lg font-bold text-white mb-1">היסטוריית שיחות</h3>
        <p className="text-xs text-neutral-500">{sessions.length} שיחות</p>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-neutral-500 text-sm">
            אין שיחות קודמות
          </div>
        ) : (
          <div className="space-y-2 p-2">
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
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs text-neutral-500">
                    {formatDate(session.updated_at)}
                  </span>
                  <span className="text-xs text-neutral-600">
                    {session.message_count} הודעות
                  </span>
                </div>
                <div className="text-sm text-white text-right truncate">
                  {session.preview || 'שיחה'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-neutral-800">
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
