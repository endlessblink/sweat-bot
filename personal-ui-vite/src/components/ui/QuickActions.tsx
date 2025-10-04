import React from 'react';

interface QuickActionsProps {
  data: {
    actions: Array<{
      label: string;
      message: string;
      icon?: string;
      variant?: 'primary' | 'secondary' | 'success' | 'warning';
    }>;
  };
  onActionClick: (message: string) => void;
}

/**
 * Quick Actions Component - Context-aware action buttons
 * Provides fast access to common SweatBot actions
 */
export default function QuickActions({ data, onActionClick }: QuickActionsProps) {
  const getVariantStyles = () => {
    // Minimal design - all buttons use same muted style
    return 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-600 hover:border-neutral-500';
  };

  return (
    <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-3 my-2 max-w-sm mx-auto" style={{ direction: 'rtl' }}>
      <div className="text-center mb-3">
        <h4 className="text-white text-sm font-medium">פעולות מהירות</h4>
        <p className="text-neutral-400 text-xs">בחר פעולה שתרצה לבצע</p>
      </div>

      <div className="grid gap-2">
        {data.actions.map((action, index) => (
          <button
            key={index}
            onClick={() => onActionClick(action.message)}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              flex items-center justify-center gap-2
              ${getVariantStyles()}
            `}
          >
            {action.icon && <span className="text-lg">{action.icon}</span>}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}