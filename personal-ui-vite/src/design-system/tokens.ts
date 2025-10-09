/**
 * SweatBot Design System Tokens
 *
 * Single source of truth for all design values.
 * Based on inspiration: docs/debug/inspiration/4orj8bEiDcDt5YLnoNRI66R4Y0.webp
 *
 * CRITICAL RULE: All components MUST use these tokens. Never hardcode colors/spacing.
 */

export const designTokens = {
  /**
   * Color Palette
   * Inspired by modern dark AI interfaces
   */
  colors: {
    // Backgrounds
    background: {
      primary: '#0A0A0A',      // Main app background (almost black)
      secondary: '#1A1A1A',    // Sidebar, cards background
      tertiary: '#252525',     // Hover states, elevated surfaces
      elevated: '#2A2A2A',     // Modals, dropdowns
    },

    // Text
    text: {
      primary: '#FFFFFF',      // Main text
      secondary: '#A0A0A0',    // Subtle text, labels
      tertiary: '#707070',     // Disabled, placeholder
      inverse: '#000000',      // Text on light backgrounds
    },

    // Borders
    border: {
      subtle: '#2A2A2A',       // Very subtle borders
      default: '#3A3A3A',      // Standard borders
      focus: '#4A4A4A',        // Focused state borders
    },

    // Interactive
    interactive: {
      primary: '#6366F1',      // Primary action (indigo-500)
      primaryHover: '#7C3AED', // Primary hover (purple-600)
      secondary: '#3B82F6',    // Secondary action (blue-500)
      danger: '#EF4444',       // Destructive actions (red-500)
      success: '#10B981',      // Success states (green-500)
    },

    // Semantic
    semantic: {
      userMessage: '#2A2A3A',  // User message background
      botMessage: '#1A1A1A',   // Bot message background
      accent: '#8B5CF6',       // Accent color (purple-500)
    },
  },

  /**
   * Typography Scale
   */
  typography: {
    fontFamily: {
      primary: '"Segoe UI", "Arial Unicode MS", "Noto Sans Hebrew", Arial, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },

    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },

    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  /**
   * Spacing Scale (based on 4px grid)
   */
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
  },

  /**
   * Border Radius
   */
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    full: '9999px',
  },

  /**
   * Shadows
   */
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.5)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.7)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.8)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.3)',
  },

  /**
   * Layout Dimensions
   */
  layout: {
    sidebarWidth: '260px',
    headerHeight: '64px',
    maxContentWidth: '1200px',
    messageMaxWidth: '48rem',  // 768px
  },

  /**
   * Z-Index Scale
   */
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
  },

  /**
   * Transitions
   */
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

/**
 * Helper functions for using tokens
 */
export const getColor = (path: string) => {
  const keys = path.split('.');
  let value: any = designTokens.colors;
  for (const key of keys) {
    value = value[key];
  }
  return value;
};

export const getSpacing = (key: keyof typeof designTokens.spacing) => {
  return designTokens.spacing[key];
};
