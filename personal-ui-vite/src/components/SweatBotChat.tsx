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

export default function SweatBotChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStatsPanel, setShowStatsPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentSessionId] = useState(() => `session_${Date.now()}`);
  const [agent] = useState(() => getSweatBotAgent({ userId: 'personal' }));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLoadSession = async (sessionId: string) => {
    // TODO: Load conversation from backend and populate messages
    console.log('Loading session:', sessionId);
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
      
      <div className="flex h-[600px] w-full bg-black border border-neutral-800 rounded-lg overflow-hidden">

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">

      {/* Header with Statistics and History Buttons */}
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

      {/* Chat History Sidebar */}
      {showHistory && (
        <ChatHistorySidebar
          onLoadSession={handleLoadSession}
          currentSessionId={currentSessionId}
        />
      )}
    </div>
    </>
  );
}