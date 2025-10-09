/**
 * Simple Assistant Chat - Following Official Documentation Pattern
 * Based on: https://docs.assistant-ui.com/runtimes/custom/local
 */

import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  type ChatModelAdapter,
  type ChatModelRunResult,
  type TextMessagePart,
  type ThreadMessage,
} from '@assistant-ui/react';

/**
 * Simple ChatModelAdapter - Exactly as per documentation
 */
const getTextParts = (message?: ThreadMessage): string[] => {
  if (!message) {
    return [];
  }

  return message.content
    ?.filter((part): part is TextMessagePart => part.type === 'text')
    .map((part) => part.text) ?? [];
};

const SweatBotModelAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }): Promise<ChatModelRunResult> {
    console.log('🔍 [Simple SweatBot] Run function called');
    console.log('📝 [Simple SweatBot] Messages:', messages);

    if (abortSignal.aborted) {
      return { content: [] };
    }

    const lastMessage = messages[messages.length - 1];
    const text = getTextParts(lastMessage).join(' ');

    console.log('✅ [Simple SweatBot] Extracted text:', text);

    // Simple test response first
    const result: ChatModelRunResult = {
      content: [
        { type: 'text', text: `✅ WORKING! You said: "${text}"` }
      ],
    };
    
    console.log('🏁 [Simple SweatBot] Returning result:', result);
    return result;
  },
};

/**
 * Message Component - Matches assistant-ui documentation pattern exactly
 */
const Message = ({ message }: { message: ThreadMessage }) => (
  <MessagePrimitive.Root message={message}>
    <div className={`flex mb-4 ${
      message.role === 'user' ? 'justify-end' : 'justify-start'
    }`}>
      <div className={`rounded-lg px-4 py-2 max-w-xs ${
        message.role === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-700 text-white'
      }`}>
        <MessagePrimitive.Content />
      </div>
    </div>
  </MessagePrimitive.Root>
);

/**
 * Simple Chat Component - Following Documentation Pattern
 */
export default function SimpleAssistantChat() {
  const runtime = useLocalRuntime(SweatBotModelAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-[600px] w-full flex-col overflow-hidden rounded-lg border border-gray-600 bg-gray-800 shadow-lg">
        <ThreadPrimitive.Root className="h-full">
          <ThreadPrimitive.Viewport className="flex h-full flex-col overflow-y-auto p-4 space-y-4">
            <ThreadPrimitive.Empty>
              <div className="text-center text-gray-400">
                <h2 className="text-lg font-semibold mb-2">🧪 Simple Test Chat</h2>
                <p>Following official assistant-ui documentation pattern</p>
              </div>
            </ThreadPrimitive.Empty>
            
            <ThreadPrimitive.Messages components={{ Message }} />
          </ThreadPrimitive.Viewport>
          
          <div className="border-t border-gray-600 p-4">
            <ComposerPrimitive.Root className="flex gap-2">
              <ComposerPrimitive.Input
                autoFocus
                placeholder="Type your message... / כתוב הודעה כאן..."
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <ComposerPrimitive.Send className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none">
                Send
              </ComposerPrimitive.Send>
            </ComposerPrimitive.Root>
          </div>
        </ThreadPrimitive.Root>
      </div>
    </AssistantRuntimeProvider>
  );
}
