import React from 'react';
import { designTokens } from '../../tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

/**
 * Input Component
 *
 * Text input with RTL support for Hebrew.
 * Uses design tokens only - NO hardcoded values.
 *
 * @example
 * <Input
 *   label="שם"
 *   placeholder="הזן את שמך"
 *   value={name}
 *   onChange={(e) => setName(e.target.value)}
 * />
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  icon,
  className = '',
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: designTokens.spacing[2],
    width: fullWidth ? '100%' : 'auto',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.text.secondary,
    fontFamily: designTokens.typography.fontFamily.primary,
  };

  const inputWrapperStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
    paddingLeft: icon ? designTokens.spacing[10] : designTokens.spacing[4],
    fontSize: designTokens.typography.fontSize.base,
    fontFamily: designTokens.typography.fontFamily.primary,
    color: designTokens.colors.text.primary,
    backgroundColor: designTokens.colors.background.tertiary,
    border: `1px solid ${isFocused ? designTokens.colors.border.focus : designTokens.colors.border.default}`,
    borderRadius: designTokens.borderRadius.md,
    outline: 'none',
    transition: `all ${designTokens.transitions.fast}`,
  };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: designTokens.spacing[4],
    color: designTokens.colors.text.tertiary,
    pointerEvents: 'none',
  };

  const helperStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.sm,
    color: error ? designTokens.colors.interactive.danger : designTokens.colors.text.tertiary,
    fontFamily: designTokens.typography.fontFamily.primary,
  };

  return (
    <div style={containerStyle} className={className}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={inputWrapperStyle}>
        {icon && <span style={iconStyle}>{icon}</span>}
        <input
          style={{ ...inputStyle, ...style }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
};
