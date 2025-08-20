'use client';

import { useState, useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { ModelSelector } from '../components/ModelSelector';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { StatsPanel } from '../components/StatsPanel';
import { PreferencesToggle } from '../components/PreferencesToggle';

export default function SweatBotChat() {
  const [userId, setUserId] = useState('noam'); // Default user
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'gemma3n' | 'vision'>('gemini');
  const [showStats, setShowStats] = useState(false);
  
  // State for chat messages
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  // Handle form submit
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  };
  
  // Send message function
  const sendMessage = async (content: string) => {
    const userMessage = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-model': selectedModel,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });
      
      if (response.ok) {
        const reader = response.body?.getReader();
        let assistantMessage = { role: 'assistant', content: '' };
        setMessages(prev => [...prev, assistantMessage]);
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            assistantMessage.content += chunk;
            setMessages(prev => prev.map((msg, idx) => 
              idx === prev.length - 1 ? assistantMessage : msg
            ));
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Append function for quick actions
  const append = (message: { role: string; content: string }) => {
    sendMessage(message.content);
  };
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Hebrew RTL support
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }, []);
  
  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-white text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">🏋️ SweatBot - מאמן כושר AI</h1>
          <p className="text-lg opacity-90">מאמן אישי שלומד את ההעדפות שלך</p>
        </header>
        
        {/* User Selector */}
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-white">משתמש:</label>
              <select 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                className="px-3 py-1 rounded bg-white/20 text-white border border-white/30"
              >
                <option value="noam">נועם (בלי שאלות)</option>
                <option value="sarah">שרה (אוהבת פידבק)</option>
                <option value="new_user">משתמש חדש</option>
              </select>
            </div>
            
            <ModelSelector 
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          </div>
        </div>
        
        {/* Main Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chat Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl h-[600px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'אתה' : 'SweatBot'}
                      </div>
                      <div>{message.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin">⏳</div>
                        <span>SweatBot חושב...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input || ''}
                    onChange={handleInputChange}
                    placeholder="כתוב הודעה..."
                    disabled={isLoading}
                    className="flex-1 p-3 border rounded-lg text-right"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input?.trim()}
                    className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    שלח
                  </button>
                </div>
              </form>
              
              {/* Voice Recorder */}
              <div className="border-t p-4">
                <VoiceRecorder 
                  onTranscription={(text) => {
                    append({ role: 'user', content: text });
                  }}
                  userId={userId}
                />
              </div>
            </div>
            
            {/* Preferences Toggle */}
            <PreferencesToggle userId={userId} />
          </div>
          
          {/* Stats Panel */}
          <div className="lg:col-span-1">
            <StatsPanel userId={userId} show={showStats} />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="font-bold mb-3">פעולות מהירות</h3>
              <div className="space-y-2">
                <button
                  onClick={() => append({ role: 'user', content: 'עשיתי 20 סקוואטים' })}
                  className="w-full text-right p-2 bg-gray-100 rounded hover:bg-gray-200"
                  disabled={isLoading}
                >
                  💪 דווח על סקוואטים
                </button>
                <button
                  onClick={() => append({ role: 'user', content: 'עשיתי 15 שכיבות סמיכה' })}
                  className="w-full text-right p-2 bg-gray-100 rounded hover:bg-gray-200"
                  disabled={isLoading}
                >
                  🏃 דווח על שכיבות
                </button>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="w-full text-right p-2 bg-blue-100 rounded hover:bg-blue-200"
                >
                  📊 {showStats ? 'הסתר' : 'הראה'} סטטיסטיקות
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}