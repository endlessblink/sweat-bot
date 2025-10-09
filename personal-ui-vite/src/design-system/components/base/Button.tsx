import React from 'react';
import { designTokens } from '../../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Button Component
 *
 * Unified button component with consistent styling across the app.
 * Uses design tokens only - NO hardcoded values.
 *
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   לחץ כאן
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: designTokens.colors.interactive.primary,
      color: designTokens.colors.text.primary,
      border: 'none',
    },
    secondary: {
      backgroundColor: designTokens.colors.background.tertiary,
      color: designTokens.colors.text.primary,
      border: `1px solid ${designTokens.colors.border.default}`,
    },
    danger: {
      backgroundColor: designTokens.colors.interactive.danger,
      color: designTokens.colors.text.primary,
      border: 'none',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: designTokens.colors.text.secondary,
      border: 'none',
    },
  };

  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
      fontSize: designTokens.typography.fontSize.sm,
      borderRadius: designTokens.borderRadius.sm,
    },
    md: {
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
      fontSize: designTokens.typography.fontSize.base,
      borderRadius: designTokens.borderRadius.md,
    },
    lg: {
      padding: `${designTokens.spacing[4]} ${designTokens.spacing[6]}`,
      fontSize: designTokens.typography.fontSize.lg,
      borderRadius: designTokens.borderRadius.lg,
    },
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing[2],
    fontFamily: designTokens.typography.fontFamily.primary,
    fontWeight: designTokens.typography.fontWeight.medium,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `all ${designTokens.transitions.fast}`,
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const hoverStyle: React.CSSProperties = {
    filter: 'brightness(1.1)',
    transform: 'translateY(-1px)',
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <button
      style={{
        ...baseStyle,
        ...(isHovered && !disabled && !loading ? hoverStyle : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || loading}
      className={className}
      {...props}
    >
      {loading && (
        <span style={{
          display: 'inline-block',
          width: '16px',
          height: '16px',
          border: `2px solid ${designTokens.colors.text.tertiary}`,
          borderTopColor: designTokens.colors.text.primary,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}>
          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </span>
      )}
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};
