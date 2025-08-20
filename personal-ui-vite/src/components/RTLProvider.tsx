import React from 'react';

interface RTLProviderProps {
  children: React.ReactNode;
}

/**
 * RTLProvider - Wraps content with Hebrew RTL support
 * 
 * This component provides:
 * - Hebrew text direction (RTL)
 * - Proper text alignment for Hebrew content
 * - Font family configuration for Hebrew fonts
 */
export default function RTLProvider({ children }: RTLProviderProps) {
  return (
    <div
      dir="rtl"
      className="font-hebrew text-right"
      style={{
        fontFamily: 'var(--font-hebrew, "Segoe UI", "Tahoma", "Arial", sans-serif)',
        direction: 'rtl',
        textAlign: 'right'
      }}
    >
      {children}
    </div>
  );
}

/**
 * HebrewText - Component for consistent Hebrew text styling
 */
export function HebrewText({ 
  children, 
  className = "",
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={`text-right ${className}`}
      style={{
        fontFamily: 'var(--font-hebrew, "Segoe UI", "Tahoma", "Arial", sans-serif)',
        direction: 'rtl',
        textAlign: 'right'
      }}
      {...props}
    >
      {children}
    </div>
  );
}