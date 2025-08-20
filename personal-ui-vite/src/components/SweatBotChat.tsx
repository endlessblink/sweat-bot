import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * SweatBot Custom Chat Component
 * 
 * Built for:
 * - Hebrew voice commands and text
 * - Exercise tracking and gamification
 * - Rich visualizations and interactive elements
 * - Multi-agent routing (Personal, Fitness, Motivational)
 * - Generative UI components
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'markdown' | 'ui-block';
  agent?: 'personal' | 'fitness' | 'motivational';
  timestamp: Date;
}

export default function SweatBotChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `היי! אני SweatBot - המאמן הכושר הדיגיטלי שלך 💪

אני יכול לעזור לך עם:
- **מעקב אימונים** - רק תגיד מה עשית (למשל: "עשיתי 20 סקוואטים")
- **תוכניות אימון** - אני אבנה לך תוכנית מותאמת
- **מוטיבציה והישגים** - נחגוג ביחד כל הצלחה!

מה בא לך להתחיל?`,
      type: 'markdown',
      agent: 'personal',
      timestamp: new Date()
    }
  ]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: message,
      type: 'text',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Call the actual SweatBot backend API
    try {
      const response = await fetch('http://localhost:8000/chat/personal-sweatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          user_id: 'personal'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          type: 'markdown',
          agent: 'personal',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('Backend API error');
      }
    } catch (error) {
      // Fallback response if backend is down
      console.error('Backend connection failed:', error);
      const fallbackMessage: Message = {
        role: 'assistant',
        content: `שגיאה בהתחברות לשרת. אבל קיבלתי: "${message}"\n\n🔄 אנא נסה שוב עוד כמה שניות`,
        type: 'markdown',
        agent: 'personal',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    }
    
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (msg: Message) => {
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
    <div className="flex flex-col h-[600px] w-full bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            💪
          </div>
          <div>
            <h2 className="text-white font-semibold">SweatBot</h2>
            <p className="text-gray-400 text-sm">המאמן הכושר הדיגיטלי שלך</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700/50 backdrop-blur-sm text-white border border-gray-600'
            }`} style={{
              fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif'
            }}>
              {renderMessage(msg)}
              {msg.agent && (
                <div className="text-xs text-gray-300 mt-1 opacity-75">
                  {msg.agent === 'personal' && '👤 מאמן אישי'}
                  {msg.agent === 'fitness' && '🏋️ מומחה כושר'}
                  {msg.agent === 'motivational' && '🎯 מוטיבטור'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input Area */}
      <div className="bg-gray-800/30 backdrop-blur-sm border-t border-gray-700 p-4">
        <div className="flex gap-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="כתוב הודעה... או תגיד מה עשית באימון / Type your message..."
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
            style={{
              fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif',
              minHeight: '44px',
              maxHeight: '120px'
            }}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed"
          >
            שלח
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <button 
            onClick={() => setMessage('עשיתי 20 סקוואטים')}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-3 py-1 rounded-full transition-colors"
          >
            📊 לוג סקוואטים
          </button>
          <button 
            onClick={() => setMessage('איך המצב שלי השבוע?')}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-3 py-1 rounded-full transition-colors"
          >
            📈 סטטיסטיקות
          </button>
          <button 
            onClick={() => setMessage('צריך מוטיבציה!')}
            className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-3 py-1 rounded-full transition-colors"
          >
            💪 מוטיבציה
          </button>
        </div>
      </div>
    </div>
  );
}