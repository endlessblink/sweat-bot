import React from 'react';
import { designTokens } from '../../tokens';

export type IconButtonSize = 'sm' | 'md' | 'lg';
export type IconButtonVariant = 'default' | 'ghost' | 'danger';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  'aria-label': string; // Required for accessibility
}

/**
 * IconButton Component
 *
 * Button with just an icon (no text).
 * Uses design tokens only - NO hardcoded values.
 *
 * @example
 * <IconButton
 *   icon={<TrashIcon />}
 *   variant="danger"
 *   aria-label="מחק"
 *   onClick={handleDelete}
 * />
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'default',
  disabled,
  className = '',
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const sizeStyles: Record<IconButtonSize, React.CSSProperties> = {
    sm: {
      width: '32px',
      height: '32px',
      fontSize: designTokens.typography.fontSize.sm,
    },
    md: {
      width: '40px',
      height: '40px',
      fontSize: designTokens.typography.fontSize.base,
    },
    lg: {
      width: '48px',
      height: '48px',
      fontSize: designTokens.typography.fontSize.lg,
    },
  };

  const variantStyles: Record<IconButtonVariant, React.CSSProperties> = {
    default: {
      backgroundColor: designTokens.colors.background.tertiary,
      color: designTokens.colors.text.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      color: designTokens.colors.text.secondary,
    },
    danger: {
      backgroundColor: 'transparent',
      color: designTokens.colors.interactive.danger,
    },
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: designTokens.borderRadius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `all ${designTokens.transitions.fast}`,
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  const hoverStyle: React.CSSProperties = {
    backgroundColor: variant === 'ghost' || variant === 'danger'
      ? designTokens.colors.background.tertiary
      : designTokens.colors.background.elevated,
  };

  return (
    <button
      style={{
        ...baseStyle,
        ...(isHovered && !disabled ? hoverStyle : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled}
      className={className}
      {...props}
    >
      {icon}
    </button>
  );
};
