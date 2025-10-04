import React, { useState, useEffect } from 'react';
import { getSweatBotAgent } from '../agent';

/**
 * Volt Agent Test Page
 * Direct testing of the TypeScript AI agent with all 6 tools
 */
export default function VoltTest() {
  const [agent] = useState(() => getSweatBotAgent({ userId: 'test-user' }));
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiKeysLoaded, setApiKeysLoaded] = useState(false);

  useEffect(() => {
    // Check if API keys are loaded
    const hasGemini = !!import.meta.env.VITE_GEMINI_API_KEY;
    const hasGroq = !!import.meta.env.VITE_GROQ_API_KEY;
    setApiKeysLoaded(hasGemini || hasGroq);
    
    if (!hasGemini && !hasGroq) {
      setError('No API keys found. Please add VITE_GEMINI_API_KEY or VITE_GROQ_API_KEY to .env file');
    }
  }, []);

  const testCommands = [
    { label: '🏋️ Log Exercise', command: 'עשיתי 20 סקוואטים' },
    { label: '📊 Check Stats', command: 'כמה נקודות יש לי?' },
    { label: '💪 Get Workout', command: 'מה לעשות היום?' },
    { label: '📈 Progress', command: 'איך אני מתקדם?' },
    { label: '🎯 Set Goal', command: 'Set me a goal of 100 squats' },
    { label: '🗑️ Reset', command: 'אפס את הנקודות שלי' }
  ];

  const sendMessage = async () => {
    if (!input.trim() || !apiKeysLoaded) return;
    
    setIsLoading(true);
    setError('');
    setResponse('');
    
    try {
      console.log('Sending to Volt Agent:', input);
      const result = await agent.chat(input);
      console.log('Volt Agent response:', result);
      setResponse(result);
    } catch (err: any) {
      console.error('Volt Agent error:', err);
      setError(err.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const quickTest = (command: string) => {
    setInput(command);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="py-6 text-center">
          <h1 className="text-2xl font-bold mb-2">Volt Agent Test</h1>
          <p className="text-neutral-400">Test the TypeScript AI Agent directly</p>
          <div className="mt-4 text-sm">
            <span className={apiKeysLoaded ? 'text-green-500' : 'text-red-500'}>
              {apiKeysLoaded ? '✅ API Keys Loaded' : '❌ No API Keys'}
            </span>
          </div>
        </header>

        {/* Quick Test Buttons */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Tests:</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {testCommands.map((test, idx) => (
              <button
                key={idx}
                onClick={() => quickTest(test.command)}
                className="p-3 bg-neutral-900 hover:bg-neutral-800 rounded-lg text-sm transition-colors"
              >
                <div>{test.label}</div>
                <div className="text-neutral-400 text-xs mt-1">{test.command}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Manual Test:</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a command in Hebrew or English..."
              className="flex-1 p-3 bg-neutral-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || !apiKeysLoaded}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim() || !apiKeysLoaded}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 rounded-lg transition-colors"
            >
              {isLoading ? 'Processing...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Response Display */}
        {(response || error || isLoading) && (
          <div className="bg-neutral-900 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Response:</h3>
            {isLoading && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                <span className="text-neutral-400">Processing...</span>
              </div>
            )}
            {error && (
              <div className="text-red-500 p-4 bg-red-900/20 rounded">
                Error: {error}
              </div>
            )}
            {response && (
              <div className="whitespace-pre-wrap text-neutral-300">
                {response}
              </div>
            )}
          </div>
        )}

        {/* Debug Info */}
        <div className="mt-8 text-xs text-neutral-500">
          <details>
            <summary className="cursor-pointer hover:text-neutral-400">Debug Info</summary>
            <pre className="mt-2 p-4 bg-neutral-900 rounded overflow-auto">
{JSON.stringify({
  apiKeys: {
    gemini: !!import.meta.env.VITE_GEMINI_API_KEY,
    groq: !!import.meta.env.VITE_GROQ_API_KEY,
  },
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'not set',
  agentStatus: agent.getStatus()
}, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}