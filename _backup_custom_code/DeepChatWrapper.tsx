'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Deep Chat component with optimized loading for Next.js 15.5
const DeepChatComponent = dynamic(
  () => import('deep-chat-react').then(mod => ({ 
    default: mod.DeepChat 
  })),
  { 
    ssr: false, // Required for Web Components
    loading: () => (
      <div className="flex items-center justify-center h-[600px] bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <div className="text-white font-medium">טוען את SweatBot...</div>
          <div className="text-gray-400 text-sm">Next.js 15.5 + React 19</div>
        </div>
      </div>
    )
  }
);

export default function DeepChatWrapper() {
  const chatRef = useRef<any>(null);

  useEffect(() => {
    // React 19 handles Web Components properties correctly
    // No need for manual property assignment in most cases
    console.log('🚀 Deep Chat initialized with Next.js 15.5 + React 19');
  }, []);

  return (
    <div className="w-full" suppressHydrationWarning>
      <DeepChatComponent
        ref={chatRef}
        style={{
          borderRadius: '12px',
          width: '100%', 
          height: '600px',
          direction: 'rtl',
          fontFamily: 'Noto Sans Hebrew, system-ui, -apple-system, sans-serif'
        }}
        initialMessages={[{
          role: 'ai',
          text: '🏋️ שלום! אני SweatBot האישי שלך - המאמן הכושר בעברית.\n\nאני כאן לעזור לך:\n• לעקוב אחרי האימונים שלך\n• לחשב נקודות על התרגילים\n• לתת עצות מקצועיות\n• לעודד אותך להתקדם\n\nפשוט ספר לי מה עשית היום או שאל אותי שאלות!'
        }]}
        request={{
          url: '/api/personal-sweatbot',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }}
        textInput={{
          placeholder: {
            text: 'כתוב הודעה... (לדוגמה: עשיתי 20 סקוואטים)'
          },
          styles: {
            container: {
              backgroundColor: '#374151',
              borderRadius: '24px',
              direction: 'rtl'
            },
            text: {
              color: '#ffffff',
              direction: 'rtl',
              textAlign: 'right'
            }
          }
        }}
        messageStyles={{
          default: {
            ai: {
              bubble: {
                backgroundColor: '#1f2937',
                color: '#ffffff',
                direction: 'rtl',
                textAlign: 'right'
              }
            },
            user: {
              bubble: {
                backgroundColor: '#2563eb',
                color: '#ffffff',
                direction: 'rtl', 
                textAlign: 'right'
              }
            }
          }
        }}
        microphone={true}
      />
    </div>
  );
}