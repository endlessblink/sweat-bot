import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import ExerciseCard from './ui/ExerciseCard';
import StatsChart from './ui/StatsChart';
import WorkoutCard from './ui/WorkoutCard';
import WorkoutDetails from './ui/WorkoutDetails';
import StatsPanel from './ui/StatsPanel';
import ChatHistorySidebar from './ui/ChatHistorySidebar';
import { getSweatBotAgent } from '../agent';

/**
 * SweatBot Clean Chat Component
 * 
 * Minimal shadcn-inspired design with:
 * - Dynamic UI generation
 * - Clean black/white color scheme
 * - Hebrew text support
 * - No hardcoded content
 */

interface UIComponent {
  type: 'exercise-card' | 'stats-chart' | 'quick-actions' | 'workout-card' | 'progress-bar' | 'achievement';
  data: any;
  actions?: Array<{
    label: string;
    action: string;
    params?: any;
  }>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'markdown' | 'ui-block' | 'loading';
  agent?: 'personal' | 'fitness' | 'motivational';
  timestamp: Date;
  uiComponent?: UIComponent;
  isLoading?: boolean;
}

interface SweatBotChatProps {
  sessionToLoad?: string | null;
  hideHeader?: boolean; // Hide header when embedded in ChatLayout
  onRegisterClearChat?: (clearFn: () => void) => void; // Register clear function with parent
  statsPanelControl?: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  };
  historyPanelControl?: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  };
}

export default function SweatBotChat({
  sessionToLoad,
  hideHeader = false,
  onRegisterClearChat,
  statsPanelControl,
  historyPanelControl
}: SweatBotChatProps = {}) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [reward, setReward] = useState<{ title: string; points: number } | null>(null);
  const [internalStatsPanel, setInternalStatsPanel] = useState(false);
  const [internalHistoryPanel, setInternalHistoryPanel] = useState(false);
  const showStatsPanel = statsPanelControl ? statsPanelControl.isOpen : internalStatsPanel;
  const setShowStatsPanel = statsPanelControl ? statsPanelControl.setIsOpen : setInternalStatsPanel;
  const showHistory = historyPanelControl ? historyPanelControl.isOpen : internalHistoryPanel;
  const setShowHistory = historyPanelControl ? historyPanelControl.setIsOpen : setInternalHistoryPanel;
  const [currentSessionId] = useState(() => `session_${Date.now()}`);
  const [agent] = useState(() => getSweatBotAgent({ userId: 'personal' }));
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWebSocket = async () => {
      try {
        // Get authentication token first
        const { getOrCreateGuestToken } = await import('../utils/auth');
        const token = await getOrCreateGuestToken();
        
        // Connect to WebSocket with token as query parameter
        const wsUrl = `${import.meta.env.VITE_BACKEND_URL.replace('http', 'ws')}/ws?token=${token}`;
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('[SweatBotChat] WebSocket connected');
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'goal_completed':
              setReward({ title: data.data.title, points: data.data.points });
              setRewardModalOpen(true);
              break;
            default:
              break;
          }
        };

        ws.onclose = () => {
          console.log('[SweatBotChat] WebSocket disconnected');
        };

        ws.onerror = (error) => {
          console.error('[SweatBotChat] WebSocket error:', error);
        };
      } catch (error) {
        console.error('[SweatBotChat] Failed to connect WebSocket:', error);
      }
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Register clear function with parent (only once on mount)
  useEffect(() => {
    if (onRegisterClearChat) {
      onRegisterClearChat(() => {
        console.log('[SweatBotChat] Clearing chat messages');
        setMessages([]);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load session when sessionToLoad prop changes
  useEffect(() => {
    console.log('[SweatBotChat] useEffect triggered, sessionToLoad:', sessionToLoad);
    if (sessionToLoad) {
      console.log('[SweatBotChat] Calling handleLoadSession with:', sessionToLoad);
      handleLoadSession(sessionToLoad);
    }
  }, [sessionToLoad]);

  // Helper function to store messages in MongoDB
  const storeMessage = async (role: 'user' | 'assistant', content: string) => {
    try {
      console.log('[storeMessage] ENTRY - role:', role, 'content length:', content.length);

      const authModule = await import('../utils/auth');
      const token = await authModule.getOrCreateGuestToken();
      const userId = authModule.getUserId();

      console.log('[storeMessage] Auth - userId:', userId, 'token:', token ? 'exists' : 'missing');

      if (!userId) {
        console.warn('[storeMessage] ❌ No user ID available, skipping message storage');
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const url = `${backendUrl}/api/memory/message`;

      console.log('[storeMessage] Fetching:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          sessionId: currentSessionId,  // Send current session ID to backend
          message: {
            role,
            content,
            timestamp: new Date().toISOString()
          }
        })
      });

      console.log('[storeMessage] Sent with sessionId:', currentSessionId);

      console.log('[storeMessage] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[storeMessage] ❌ Failed - status:', response.status, 'error:', errorText);
      } else {
        const result = await response.json();
        console.log('[storeMessage] ✅ Success:', result);
      }
    } catch (error) {
      console.error('[storeMessage] ❌ Exception:', error);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      console.log('[handleLoadSession] Loading session:', sessionId);
      setIsLoading(true);

      const authModule = await import('../utils/auth');
      const token = await authModule.getOrCreateGuestToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/memory/session/${sessionId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load session: ${response.status}`);
      }

      const data = await response.json();
      console.log('[handleLoadSession] Loaded', data.messages?.length || 0, 'messages');

      // Transform backend messages to frontend Message format
      const loadedMessages: Message[] = (data.messages || []).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        type: msg.role === 'user' ? 'text' as const : 'markdown' as const,
        agent: msg.role === 'assistant' ? 'personal' as const : undefined,
        timestamp: new Date(msg.timestamp || Date.now())
      }));

      setMessages(loadedMessages);
      setShowHistory(false);
      console.log(`✅ Loaded ${loadedMessages.length} messages from session:`, sessionId);
    } catch (error) {
      console.error('[handleLoadSession] Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'שגיאה בטעינת היסטוריה. נסה שוב מאוחר יותר.',
        type: 'markdown',
        agent: 'personal',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex gap-1 items-center" style={{ direction: 'ltr' }}>
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      <span className="text-neutral-500 text-sm mr-2">SweatBot מקליד...</span>
    </div>
  );

  // For Hebrew interface, always use RTL for proper mixed content handling
  const shouldUseRTL = (): boolean => {
    // Since this is a Hebrew fitness app, always use RTL
    // This ensures proper rendering of mixed Hebrew-English content
    return true;
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Store message text and clear input immediately
    const messageText = message;
    setMessage('');
    setIsLoading(true);
    
    // Keep focus on input after sending message
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add loading indicator
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'loading',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    // Call the Volt Agent directly (TypeScript AI + Tools)
    try {
      // Use Volt Agent for AI processing - it now has Hebrew parsing fallback
      const aiResponse = await agent.chat(messageText);
      
      // Log basic response info for verification
      console.log('SweatBot Response received:', typeof aiResponse, aiResponse?.length || 0, 'chars');
      
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      // CRITICAL FIX: Trust the agent's response - it has Hebrew parsing fallback
      let cleanResponse: string;
      if (typeof aiResponse === 'string') {
        cleanResponse = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object') {
        console.error('ERROR: agent.chat() returned an object instead of string:', aiResponse);
        // Try to extract meaningful content
        if ('content' in aiResponse && typeof aiResponse.content === 'string') {
          cleanResponse = aiResponse.content;
        } else if ('response' in aiResponse && typeof aiResponse.response === 'string') {
          cleanResponse = aiResponse.response;
        } else {
          cleanResponse = 'שגיאה בפורמט התגובה';
        }
      } else {
        cleanResponse = 'שגיאה בפורמט התגובה';
      }
      
      // Let the AI handle everything naturally - no hardcoded UI components
      let assistantMessage: Message = {
        role: 'assistant',
        content: cleanResponse,
        type: 'markdown', // Simple markdown response by default
        agent: 'personal',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);

      //Store both messages to MongoDB (non-blocking)
      console.log('[MongoDB] Starting to store user message:', messageText);
      storeMessage('user', messageText).catch(err =>
        console.error('[MongoDB] Failed to store user message:', err)
      );
      console.log('[MongoDB] Starting to store assistant message:', cleanResponse);
      storeMessage('assistant', cleanResponse).catch(err =>
        console.error('[MongoDB] Failed to store assistant message:', err)
      );

      // Refocus input after response
      inputRef.current?.focus();
      
    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));

      console.error('Agent service connection failed:', error);

      // Show user-friendly error message
      const errorMessage: Message = {
        role: 'assistant',
        content: `מצטער, יש לי בעיה זמנית. האם תוכל לנסות שוב? אם הבעיה חוזרת, ייתכן שצריך לבדוק את החיבור לשירות.`,
        type: 'markdown',
        agent: 'personal',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      // Refocus input even on error
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle UI component interactions
  const handleUIAction = (action: string, params?: any) => {
    // Send the action as a message to trigger bot response
    const actionMessage = params ? `${action} ${JSON.stringify(params)}` : action;
    handleQuickMessage(actionMessage);
  };

  const handleQuickMessage = async (quickMessage: string) => {
    // Add user message immediately without showing in input
    const userMessage: Message = {
      role: 'user',
      content: quickMessage,
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Add loading indicator
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'loading',
      timestamp: new Date(),
      isLoading: true
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    // Call agent service directly
    try {
      const response = await fetch('http://localhost:8000/chat/personal-sweatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: quickMessage,
          user_id: 'personal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Remove loading message
        setMessages(prev => prev.filter(msg => !msg.isLoading));
        
        let assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          type: 'markdown',
          agent: 'personal',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      // Remove loading message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      console.error('Quick message failed:', error);
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `שגיאה בהתחברות לשרת. אבל קיבלתי: "${quickMessage}"`,
        type: 'markdown',
        agent: 'personal',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: Message) => {
    // Render loading indicator
    if (msg.type === 'loading') {
      return <TypingIndicator />;
    }
    
    // Render UI component if present
    if (msg.type === 'ui-block' && msg.uiComponent) {
      const { type, data } = msg.uiComponent;
      
      switch (type) {
        case 'exercise-card':
          return (
            <div>
              {msg.content && <div className="mb-2">{msg.content}</div>}
              <ExerciseCard data={data} />
            </div>
          );
          
        case 'stats-chart':
          return (
            <div>
              {msg.content && <div className="mb-2">{msg.content}</div>}
              <StatsChart data={data} />
            </div>
          );
          
        // QuickActions removed - should never appear automatically
        // Tools will handle specific actions when explicitly requested
          
        case 'workout-card':
          return (
            <div>
              {msg.content && <div className="mb-2">{msg.content}</div>}
              <WorkoutCard 
                data={data}
                onStartWorkout={(workoutName) => handleUIAction('התחל אימון', { workout: workoutName })}
                onViewDetails={() => handleUIAction('הצג פרטי אימון', data)}
              />
            </div>
          );
          
        default:
          return <span>{msg.content}</span>;
      }
    }
    
    // Render markdown or text with clickable stats links
    if (msg.type === 'markdown' || msg.type === 'text') {
      // Check if message contains stats link patterns
      const hasStatsLink = msg.content.includes('[ראה סטטיסטיקות]') || 
                          msg.content.includes('[הצג פאנל מלא]') ||
                          msg.content.includes('[הצג פאנל]');
      
      if (hasStatsLink) {
        // Replace brackets with clickable button
        const parts = msg.content.split(/\[(ראה סטטיסטיקות|הצג פאנל מלא|הצג פאנל)\]/);
        return (
          <div>
            {parts.map((part, index) => {
              if (part === 'ראה סטטיסטיקות' || part === 'הצג פאנל מלא' || part === 'הצג פאנל') {
                return (
                  <button
                    key={index}
                    onClick={() => setShowStatsPanel(true)}
                    className="inline-block px-3 py-1 mt-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm font-medium"
                  >
                    📊 {part}
                  </button>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
        );
      }
      
      return msg.type === 'markdown' ? (
        <div className="space-y-2">
          {msg.content.split('\n\n').map((paragraph, index) => (
            <div key={index} className="leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                className="prose prose-invert prose-sm max-w-none [&>p]:m-0"
              >
                {paragraph}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      ) : (
        <span>{msg.content}</span>
      );
    }
    
    return <span>{msg.content}</span>;
  };

  return (
    <>
      {/* Stats Panel Overlay */}
      {showStatsPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <StatsPanel onClose={() => setShowStatsPanel(false)} />
          </div>
        </div>
      )}

      {showHistory && hideHeader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full" style={{ direction: 'rtl' }}>
            <ChatHistorySidebar
              onLoadSession={handleLoadSession}
              currentSessionId={currentSessionId}
              onClose={() => setShowHistory(false)}
            />
          </div>
        </div>
      )}

      {rewardModalOpen && reward && (
        <RewardModal
          isOpen={rewardModalOpen}
          onClose={() => setRewardModalOpen(false)}
          title={reward.title}
          points={reward.points}
        />
      )}

      <div className={`flex w-full bg-black overflow-hidden ${hideHeader ? 'h-full' : 'h-[600px] border border-neutral-800 rounded-lg'}`}>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">

      {/* Header with Statistics and History Buttons - Only show when not embedded */}
      {!hideHeader && (
        <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <div>
            <h2 className="text-lg font-bold text-white">SweatBot</h2>
            <p className="text-xs text-neutral-500">המאמן הכושר הדיגיטלי שלך</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm font-medium flex items-center gap-2"
              title="היסטוריית שיחות"
            >
              <span>📜</span>
              <span className="hidden sm:inline">היסטוריה</span>
            </button>
            <button
              onClick={() => setShowStatsPanel(true)}
              className="px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded hover:bg-neutral-700 transition-colors text-sm font-medium flex items-center gap-2"
              title="הצג סטטיסטיקות"
            >
              <span>📊</span>
              <span className="hidden sm:inline">סטטיסטיקות</span>
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-neutral-500 text-sm text-center">
              <div className="text-xs text-neutral-600">שלח הודעה כדי להתחיל</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const useRTL = shouldUseRTL();
              return (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-md ${
                    msg.role === 'user' 
                      ? 'bg-neutral-900 text-white border border-neutral-800' 
                      : 'bg-neutral-950 text-white border border-neutral-800'
                  }`} style={{
                    fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif',
                    direction: 'rtl',
                    textAlign: 'right',
                    unicodeBidi: 'embed' // Forces proper RTL rendering for mixed content
                  }}>
                    {renderMessage(msg)}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="border-t border-neutral-800 p-4">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שלח הודעה..."
            disabled={isLoading}
            className="flex-1 bg-neutral-950 text-white placeholder-neutral-500 px-3 py-2 rounded-md border border-neutral-800 focus:outline-none focus:border-white text-sm disabled:opacity-50"
            style={{
              fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif',
              direction: 'rtl',
              textAlign: 'right',
              unicodeBidi: 'embed'
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            className="bg-white text-black px-4 py-2 rounded-md hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500 transition-colors text-sm font-medium"
          >
            {isLoading ? '...' : '→'}
          </button>
        </div>
      </div>
      </div>

      {/* Chat History Sidebar - Only show when not embedded */}
      {!hideHeader && showHistory && (
        <ChatHistorySidebar
          onLoadSession={handleLoadSession}
          currentSessionId={currentSessionId}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
    </>
  );
}