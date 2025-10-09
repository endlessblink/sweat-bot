import React from 'react';
import { designTokens } from '../../tokens';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'danger';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

/**
 * Badge Component
 *
 * Status indicators, counts, and labels.
 * Uses design tokens only - NO hardcoded values.
 *
 * @example
 * <Badge variant="success" size="sm">
 *   פעיל
 * </Badge>
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
    default: {
      backgroundColor: designTokens.colors.background.tertiary,
      color: designTokens.colors.text.secondary,
    },
    primary: {
      backgroundColor: designTokens.colors.interactive.primary,
      color: designTokens.colors.text.primary,
    },
    success: {
      backgroundColor: designTokens.colors.interactive.success,
      color: designTokens.colors.text.primary,
    },
    danger: {
      backgroundColor: designTokens.colors.interactive.danger,
      color: designTokens.colors.text.primary,
    },
  };

  const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: {
      padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
      fontSize: designTokens.typography.fontSize.xs,
    },
    md: {
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
      fontSize: designTokens.typography.fontSize.sm,
    },
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: designTokens.spacing[1],
    fontFamily: designTokens.typography.fontFamily.primary,
    fontWeight: designTokens.typography.fontWeight.medium,
    borderRadius: designTokens.borderRadius.full,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const dotStyle: React.CSSProperties = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  };

  return (
    <span style={baseStyle}>
      {dot && <span style={dotStyle} />}
      {children}
    </span>
  );
};
