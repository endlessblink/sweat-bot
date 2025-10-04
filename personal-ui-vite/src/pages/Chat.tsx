import React from 'react';
import SweatBotChat from '../components/SweatBotChat';

/**
 * Clean Chat Page - Minimal shadcn-style design
 * Now serves as the main page at root route
 */
export default function Chat() {
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="container mx-auto max-w-4xl">
        <header className="py-6">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white mb-2">
              SweatBot
            </h1>
            <p className="text-neutral-400 text-sm">
              המאמן הכושר הדיגיטלי שלך
            </p>
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          <SweatBotChat />
        </div>
      </div>
    </div>
  );
}