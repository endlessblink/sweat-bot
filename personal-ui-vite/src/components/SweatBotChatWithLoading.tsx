import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ExerciseCard from './ui/ExerciseCard';
import StatsChart from './ui/StatsChart';
import QuickActions from './ui/QuickActions';
import WorkoutCard from './ui/WorkoutCard';
import DataMapper from '../services/dataMapper';

/**
 * SweatBot Clean Chat Component with Loading Indicator
 * 
 * Minimal shadcn-inspired design with:
 * - Dynamic UI generation
 * - Clean black/white color scheme
 * - Hebrew text support
 * - No hardcoded content
 * - Loading states with typing indicator
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

  // Typing indicator component
  const TypingIndicator = () => (
    <div className="flex gap-2 items-center" style={{ direction: 'ltr' }}>
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-neutral-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
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
    if (!message.trim() || isLoading) return;
    
    // Store message text and clear input immediately
    const messageText = message;
    setMessage('');
    setIsLoading(true);
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: messageText,
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add loading message
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'loading',
      isLoading: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    // Call the SweatBot Agent Service (AI + Tools)
    try {
      const response = await fetch('http://localhost:8000/chat/personal-sweatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          user_id: 'personal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Map backend response using DataMapper
        const mappedResponse = DataMapper.mapBackendResponse(data);
        const hasUIComponents = mappedResponse.ui_components && mappedResponse.ui_components.length > 0;
        
        let assistantMessage: Message = {
          role: 'assistant',
          content: mappedResponse.response,
          type: hasUIComponents ? 'ui-block' : 'markdown',
          agent: 'personal',
          timestamp: mappedResponse.timestamp
        };

        // Use the first valid UI component from backend
        if (hasUIComponents) {
          const firstComponent = mappedResponse.ui_components[0];
          
          // Validate component data before using
          if (DataMapper.validateComponentData(firstComponent)) {
            assistantMessage.uiComponent = {
              type: firstComponent.type,
              data: firstComponent.data,
              actions: firstComponent.actions
            };
          } else {
            console.warn('Invalid component data, using fallback');
            const fallback = DataMapper.createErrorFallback();
            assistantMessage.uiComponent = {
              type: fallback.type,
              data: fallback.data,
              actions: fallback.actions
            };
          }
        }
        
        // Remove loading message and add real response
        setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      } else {
        throw new Error('Backend API error');
      }
    } catch (error) {
      // Fallback response if backend is down
      console.error('Backend connection failed:', error);
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `שגיאה בהתחברות לשרת. אבל קיבלתי: \"${messageText}\"\\n\\n🔄 אנא נסה שוב עוד כמה שניות`,
        type: 'markdown',
        agent: 'personal',
        timestamp: new Date()
      };
      
      // Remove loading message and add error response
      setMessages(prev => [...prev.slice(0, -1), fallbackMessage]);
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
    if (isLoading) return;
    
    setIsLoading(true);
    
    // Add user message immediately without showing in input
    const userMessage: Message = {
      role: 'user',
      content: quickMessage,
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add loading message
    const loadingMessage: Message = {
      role: 'assistant',
      content: '',
      type: 'loading',
      isLoading: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, loadingMessage]);
    
    // Call backend directly
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
        
        // Map backend response using DataMapper
        const mappedResponse = DataMapper.mapBackendResponse(data);
        const hasUIComponents = mappedResponse.ui_components && mappedResponse.ui_components.length > 0;
        
        let assistantMessage: Message = {
          role: 'assistant',
          content: mappedResponse.response,
          type: hasUIComponents ? 'ui-block' : 'markdown',
          agent: 'personal',
          timestamp: mappedResponse.timestamp
        };

        // Use the first valid UI component from backend
        if (hasUIComponents) {
          const firstComponent = mappedResponse.ui_components[0];
          
          // Validate component data before using
          if (DataMapper.validateComponentData(firstComponent)) {
            assistantMessage.uiComponent = {
              type: firstComponent.type,
              data: firstComponent.data,
              actions: firstComponent.actions
            };
          } else {
            console.warn('Invalid component data, using fallback');
            const fallback = DataMapper.createErrorFallback();
            assistantMessage.uiComponent = {
              type: fallback.type,
              data: fallback.data,
              actions: fallback.actions
            };
          }
        }
        
        // Remove loading message and add real response
        setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      }
    } catch (error) {
      console.error('Quick message failed:', error);
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `שגיאה בהתחברות לשרת. אבל קיבלתי: \"${quickMessage}\"`,
        type: 'markdown',
        agent: 'personal',
        timestamp: new Date()
      };
      
      // Remove loading message and add error response
      setMessages(prev => [...prev.slice(0, -1), fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (msg: Message) => {
    // Render loading indicator
    if (msg.type === 'loading' && msg.isLoading) {
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
          
        case 'quick-actions':
          return (
            <div>
              {msg.content && <div className="mb-2">{msg.content}</div>}
              <QuickActions 
                data={data} 
                onActionClick={handleQuickMessage}
              />
            </div>
          );
          
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
    
    // Render markdown
    if (msg.type === 'markdown') {
      return (
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          className="prose prose-invert max-w-none"
        >
          {msg.content}
        </ReactMarkdown>
      );
    }
    
    return <span>{msg.content}</span>;
  };

  return (
    <div className="flex flex-col h-[600px] w-full bg-black border border-neutral-800 rounded-lg overflow-hidden">
      
      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-neutral-500 text-sm text-center">
              <div className="mb-2">SweatBot</div>
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
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="שלח הודעה..."
            disabled={isLoading}
            className={`flex-1 bg-neutral-950 text-white placeholder-neutral-500 px-3 py-2 rounded-md border border-neutral-800 focus:outline-none focus:border-white text-sm ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
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
            className={`bg-white text-black px-4 py-2 rounded-md transition-colors text-sm font-medium ${
              isLoading 
                ? 'opacity-50 cursor-not-allowed bg-neutral-600' 
                : 'hover:bg-neutral-200 disabled:bg-neutral-800 disabled:text-neutral-500'
            }`}
          >
            {isLoading ? '⏳' : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}