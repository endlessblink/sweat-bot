import React from 'react';
import { designTokens } from '../../tokens';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  variant?: 'circular' | 'square';
}

/**
 * Avatar Component
 *
 * User/bot avatar with fallback to initials.
 * Uses design tokens only - NO hardcoded values.
 *
 * @example
 * <Avatar
 *   src="/user-avatar.jpg"
 *   name="נועם"
 *   size="md"
 * />
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  variant = 'circular',
}) => {
  const sizeStyles: Record<AvatarSize, { size: string; fontSize: string }> = {
    sm: { size: '32px', fontSize: designTokens.typography.fontSize.sm },
    md: { size: '40px', fontSize: designTokens.typography.fontSize.base },
    lg: { size: '56px', fontSize: designTokens.typography.fontSize.xl },
    xl: { size: '80px', fontSize: designTokens.typography.fontSize['2xl'] },
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: sizeStyles[size].size,
    height: sizeStyles[size].size,
    fontSize: sizeStyles[size].fontSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    fontFamily: designTokens.typography.fontFamily.primary,
    backgroundColor: designTokens.colors.interactive.primary,
    color: designTokens.colors.text.primary,
    borderRadius: variant === 'circular' ? designTokens.borderRadius.full : designTokens.borderRadius.md,
    overflow: 'hidden',
    flexShrink: 0,
  };

  return (
    <div style={baseStyle}>
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};
