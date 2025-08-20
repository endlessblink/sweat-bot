import React, { useState, useEffect } from 'react';
import {
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  AssistantRuntimeProvider
} from '@assistant-ui/react';
import { useLocalRuntime } from '@assistant-ui/react';
import { SweatBotAdapter } from '../../lib/sweatbot-runtime';
import RTLProvider, { HebrewText } from '../RTLProvider';
import { renderTool } from './ToolRegistry';
import { cn } from '../../lib/utils';

/**
 * SweatBot Chat - Vite Implementation
 * 
 * Clean client-side chat component with no SSR complexity!
 * Uses mounted state pattern for safety, but no dynamic imports needed.
 */

// Custom Message Component with Hebrew Support
const HebrewMessage = React.forwardRef<
  React.ElementRef<typeof MessagePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MessagePrimitive.Root>
>(({ className, ...props }, ref) => (
  <MessagePrimitive.Root
    ref={ref}
    className={cn(
      "grid w-full max-w-2xl auto-rows-auto grid-cols-[minmax(72px,1fr)_auto] gap-y-2 py-4",
      className
    )}
    {...props}
  >
    <RTLProvider>
      <div className="col-start-1 row-start-1 overflow-hidden break-words">
        <MessagePrimitive.Content
          components={{
            Text: ({ children }) => (
              <HebrewText className="whitespace-pre-wrap">
                {children}
              </HebrewText>
            ),
            tools: {
              // Simple tool registry
              show_points: (props: any) => renderTool('show_points', props),
              show_workout_history: (props: any) => renderTool('show_workout_history', props),
              show_goals_progress: (props: any) => renderTool('show_goals_progress', props),
              show_stats: (props: any) => renderTool('show_stats', props),
            }
          }}
        />
      </div>
      
      {/* Message Actions */}
      <div className="col-start-2 row-start-1 -mr-1 mt-2.5 flex flex-col">
        <ActionBarPrimitive.Root
          hideWhenRunning
          autohide="not-last"
          className="flex flex-row items-center"
        >
          <ActionBarPrimitive.Copy className="size-6 p-1 text-muted-foreground hover:text-foreground" />
          <ActionBarPrimitive.Reload className="size-6 p-1 text-muted-foreground hover:text-foreground" />
        </ActionBarPrimitive.Root>
      </div>
    </RTLProvider>
  </MessagePrimitive.Root>
));
HebrewMessage.displayName = "HebrewMessage";

// Custom Composer with Hebrew Support
const HebrewComposer = React.forwardRef<
  React.ElementRef<typeof ComposerPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ComposerPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ComposerPrimitive.Root
    ref={ref}
    className={cn("flex w-full flex-col gap-2", className)}
    {...props}
  >
    <RTLProvider>
      <div className="flex w-full flex-row gap-2">
        <ComposerPrimitive.Input
          autoFocus
          placeholder="ספר לי על האימון שלך... (לדוגמה: הראה נקודות)"
          rows={1}
          className="flex-1 resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed max-h-40 p-3 border border-border rounded-lg"
          style={{
            fontFamily: 'var(--font-hebrew)',
            direction: 'rtl',
            textAlign: 'right'
          }}
        />
        <ComposerPrimitive.Send className="size-8 p-2 text-muted-foreground hover:text-foreground disabled:opacity-50" />
      </div>
    </RTLProvider>
  </ComposerPrimitive.Root>
));
HebrewComposer.displayName = "HebrewComposer";

// Welcome Message Component
const WelcomeMessage = () => (
  <ThreadPrimitive.Empty>
    <RTLProvider>
      <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
        <HebrewText>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🏋️</span>
            <div className="text-center">
              <h2 className="text-xl font-bold text-primary">
                שלום! אני SweatBot האישי שלך
              </h2>
              <p className="text-sm text-muted-foreground">
                המאמן הכושר בעברית - גרסת Vite
              </p>
            </div>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground max-w-md text-center">
            <p>נסה לכתוב:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-500/10 p-2 rounded">
                📊 "הראה נקודות"
              </div>
              <div className="bg-green-500/10 p-2 rounded">
                🏋️ "עשיתי סקוואטים"
              </div>
            </div>
          </div>
        </HebrewText>
      </div>
    </RTLProvider>
  </ThreadPrimitive.Empty>
);

// Main Thread Component
const SweatBotThread = () => (
  <ThreadPrimitive.Root className="h-full">
    <ThreadPrimitive.Viewport className="flex h-full flex-col items-center overflow-y-scroll scroll-smooth bg-background px-4 pt-8">
      <WelcomeMessage />
      
      <ThreadPrimitive.Messages
        components={{
          UserMessage: HebrewMessage,
          AssistantMessage: HebrewMessage,
          EditComposer: HebrewComposer,
        }}
        className="flex w-full max-w-2xl flex-col gap-4 pb-4"
      />
    </ThreadPrimitive.Viewport>
    
    <div className="sticky bottom-0 mt-4 flex w-full flex-col items-center justify-end bg-background pb-4">
      <HebrewComposer className="w-full max-w-2xl px-4" />
    </div>
  </ThreadPrimitive.Root>
);

/**
 * AssistantChat - Main Component (No SSR Issues!)
 * 
 * In Vite, we don't need dynamic imports or SSR workarounds.
 * Just use the mounted state pattern for extra safety.
 */
export default function AssistantChat() {
  // Mounted state pattern for safety (from Next.js research)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always call useLocalRuntime to maintain hooks order
  const runtime = useLocalRuntime(SweatBotAdapter);

  // Show loading while mounting (safety pattern)
  if (!mounted) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <HebrewText>
            <div className="text-lg font-semibold text-primary">טוען SweatBot...</div>
            <div className="text-sm text-muted-foreground">גרסת Vite - ללא בעיות cache!</div>
          </HebrewText>
        </div>
      </div>
    );
  }

  // Render full UI (client-side only, no SSR issues!)
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-[600px] w-full flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <SweatBotThread />
      </div>
    </AssistantRuntimeProvider>
  );
}