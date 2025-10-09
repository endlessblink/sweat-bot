import React from 'react';
import { designTokens } from '../../tokens';
import { Card } from '../base/Card';

export interface StatisticsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'primary';
}

/**
 * StatisticsCard Component
 *
 * Display key metrics with optional change indicators.
 * Perfect for dashboards and analytics views.
 *
 * @example
 * <StatisticsCard
 *   title="נקודות השבוע"
 *   value="247"
 *   change={{ value: 12, label: "מהשבוע שעבר" }}
 *   variant="success"
 * />
 */
export const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  change,
  icon,
  variant = 'default',
}) => {
  const variantColors = {
    default: designTokens.colors.text.primary,
    success: designTokens.colors.interactive.success,
    danger: designTokens.colors.interactive.danger,
    primary: designTokens.colors.interactive.primary,
  };

  const changeColor = change && change.value > 0
    ? designTokens.colors.interactive.success
    : designTokens.colors.interactive.danger;

  return (
    <Card variant="elevated" padding={6}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: designTokens.spacing[4],
      }}>
        <div style={{
          fontSize: designTokens.typography.fontSize.sm,
          color: designTokens.colors.text.secondary,
          fontFamily: designTokens.typography.fontFamily.primary,
          fontWeight: designTokens.typography.fontWeight.medium,
        }}>
          {title}
        </div>
        {icon && (
          <div style={{
            fontSize: designTokens.typography.fontSize.xl,
            color: variantColors[variant],
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{
        fontSize: designTokens.typography.fontSize['3xl'],
        fontWeight: designTokens.typography.fontWeight.bold,
        color: variantColors[variant],
        fontFamily: designTokens.typography.fontFamily.primary,
        marginBottom: change ? designTokens.spacing[2] : 0,
      }}>
        {value}
      </div>

      {change && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: designTokens.spacing[1],
          fontSize: designTokens.typography.fontSize.sm,
          fontFamily: designTokens.typography.fontFamily.primary,
        }}>
          <span style={{
            color: changeColor,
            fontWeight: designTokens.typography.fontWeight.semibold,
          }}>
            {change.value > 0 ? '↑' : '↓'} {Math.abs(change.value)}%
          </span>
          <span style={{ color: designTokens.colors.text.tertiary }}>
            {change.label}
          </span>
        </div>
      )}
    </Card>
  );
};
