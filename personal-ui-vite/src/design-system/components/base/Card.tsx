import React from 'react';
import { designTokens } from '../../tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof designTokens.spacing;
  children: React.ReactNode;
}

/**
 * Card Component
 *
 * Container component with consistent padding and background.
 * Uses design tokens only - NO hardcoded values.
 *
 * @example
 * <Card variant="elevated" padding={4}>
 *   <h2>כותרת</h2>
 *   <p>תוכן הכרטיס</p>
 * </Card>
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 4,
  children,
  className = '',
  style,
  ...props
}) => {
  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: designTokens.colors.background.secondary,
      border: `1px solid ${designTokens.colors.border.subtle}`,
      boxShadow: 'none',
    },
    elevated: {
      backgroundColor: designTokens.colors.background.elevated,
      border: 'none',
      boxShadow: designTokens.shadows.md,
    },
    outlined: {
      backgroundColor: 'transparent',
      border: `1px solid ${designTokens.colors.border.default}`,
      boxShadow: 'none',
    },
  };

  const baseStyle: React.CSSProperties = {
    padding: designTokens.spacing[padding],
    borderRadius: designTokens.borderRadius.lg,
    transition: `all ${designTokens.transitions.base}`,
    ...variantStyles[variant],
  };

  return (
    <div
      style={{ ...baseStyle, ...style }}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
};
