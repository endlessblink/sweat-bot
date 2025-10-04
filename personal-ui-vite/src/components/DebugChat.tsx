import React, { useState } from 'react';

/**
 * Debug Chat Component - Pure HTML/CSS without assistant-ui
 * This will help us isolate if the issue is assistant-ui specific or broader CSS/font issue
 */
export default function DebugChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, text: string}>>([]);

  const sendMessage = () => {
    if (!message.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', text: message }];
    // Add assistant response
    newMessages.push({ role: 'assistant', text: `✅ DEBUG WORKING! You said: "${message}"` });
    
    setMessages(newMessages);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      width: '100%',
      border: '1px solid #4b5563',
      borderRadius: '8px',
      backgroundColor: '#1f2937',
      overflow: 'hidden'
    }}>
      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '16px',
            fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              🛠️ Debug Chat (Pure HTML/CSS)
            </h2>
            <p>Testing if input and messages work without assistant-ui</p>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '16px'
          }}>
            <div style={{
              backgroundColor: msg.role === 'user' ? '#2563eb' : '#374151',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '8px',
              maxWidth: '300px',
              fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif',
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input Area */}
      <div style={{
        borderTop: '1px solid #4b5563',
        padding: '16px',
        display: 'flex',
        gap: '8px'
      }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... / כתוב הודעה כאן..."
          style={{
            flex: 1,
            padding: '12px',
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, Arial, "Noto Sans Hebrew", sans-serif',
            outline: 'none'
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: '12px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}