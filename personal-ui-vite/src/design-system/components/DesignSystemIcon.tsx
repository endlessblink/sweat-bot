import React from 'react';
import { designTokens } from '../tokens';

/**
 * Custom Design System Icon
 *
 * Unique SweatBot design system emoticon combining:
 * - Dumbbell (fitness/strength)
 * - Color palette (design)
 * - Gradient background (modern UI)
 */
export const DesignSystemIcon: React.FC<{ size?: number }> = ({ size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
      }}
    >
      {/* Background Circle with Gradient */}
      <circle
        cx="32"
        cy="32"
        r="30"
        fill="url(#designGradient)"
      />

      {/* Gradient Definition */}
      <defs>
        <linearGradient id="designGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={designTokens.colors.interactive.primary} />
          <stop offset="100%" stopColor={designTokens.colors.interactive.primaryHover} />
        </linearGradient>
      </defs>

      {/* Dumbbell Icon (Fitness) */}
      <g transform="translate(12, 20)">
        {/* Left Weight */}
        <rect x="0" y="4" width="6" height="16" rx="2" fill="#FFFFFF" opacity="0.9" />
        {/* Bar */}
        <rect x="5" y="10" width="30" height="4" rx="1" fill="#FFFFFF" opacity="0.9" />
        {/* Right Weight */}
        <rect x="34" y="4" width="6" height="16" rx="2" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* Color Palette Dots (Design) */}
      <g transform="translate(18, 42)">
        <circle cx="4" cy="4" r="3" fill={designTokens.colors.interactive.danger} />
        <circle cx="14" cy="4" r="3" fill={designTokens.colors.interactive.success} />
        <circle cx="24" cy="4" r="3" fill={designTokens.colors.interactive.secondary} />
      </g>

      {/* Sparkle Effect */}
      <g opacity="0.8">
        <circle cx="48" cy="16" r="2" fill="#FFFFFF" />
        <circle cx="16" cy="14" r="1.5" fill="#FFFFFF" />
        <circle cx="50" cy="46" r="1.5" fill="#FFFFFF" />
      </g>
    </svg>
  );
};

/**
 * Small version for inline use
 */
export const DesignSystemIconSmall: React.FC = () => {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '24px',
      height: '24px',
      borderRadius: designTokens.borderRadius.sm,
      background: `linear-gradient(135deg, ${designTokens.colors.interactive.primary} 0%, ${designTokens.colors.interactive.primaryHover} 100%)`,
      fontSize: '14px',
    }}>
      💪🎨
    </span>
  );
};
