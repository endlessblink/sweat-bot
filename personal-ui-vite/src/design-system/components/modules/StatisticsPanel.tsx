import React from 'react';
import { designTokens } from '../../tokens';
import { Card } from '../base/Card';
import { Button } from '../base/Button';

export interface Stat {
  label: string;
  value: string | number;
  change?: {
    value: number;
    label: string;
  };
  icon?: string;
  variant?: 'default' | 'success' | 'danger' | 'primary';
}

export interface StatisticsPanelProps {
  title: string;
  stats: Stat[];
  onClear?: () => void;
  showClearButton?: boolean;
}

/**
 * StatisticsPanel Component
 *
 * WHERE TO USE: src/components/ui/StatsPanel.tsx
 *
 * Complete statistics dashboard widget with multiple metrics.
 * Shows key stats with optional change indicators.
 *
 * @example
 * <StatisticsPanel
 *   title="סטטיסטיקות השבוע"
 *   stats={weeklyStats}
 *   onClear={handleClear}
 *   showClearButton
 * />
 */
export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  title,
  stats,
  onClear,
  showClearButton = false,
}) => {
  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing[6],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.text.primary,
    fontFamily: designTokens.typography.fontFamily.primary,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: designTokens.spacing[4],
  };

  const variantColors = {
    default: designTokens.colors.text.primary,
    success: designTokens.colors.interactive.success,
    danger: designTokens.colors.interactive.danger,
    primary: designTokens.colors.interactive.primary,
  };

  return (
    <Card variant="elevated" padding={6}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {showClearButton && onClear && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            נקה
          </Button>
        )}
      </div>

      <div style={gridStyle}>
        {stats.map((stat, index) => {
          const changeColor = stat.change && stat.change.value > 0
            ? designTokens.colors.interactive.success
            : designTokens.colors.interactive.danger;

          return (
            <Card key={index} variant="default" padding={4}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: designTokens.spacing[3],
              }}>
                <div style={{
                  fontSize: designTokens.typography.fontSize.sm,
                  color: designTokens.colors.text.secondary,
                  fontFamily: designTokens.typography.fontFamily.primary,
                  fontWeight: designTokens.typography.fontWeight.medium,
                }}>
                  {stat.label}
                </div>
                {stat.icon && (
                  <div style={{ fontSize: designTokens.typography.fontSize.xl }}>
                    {stat.icon}
                  </div>
                )}
              </div>

              <div style={{
                fontSize: designTokens.typography.fontSize['2xl'],
                fontWeight: designTokens.typography.fontWeight.bold,
                color: variantColors[stat.variant || 'default'],
                fontFamily: designTokens.typography.fontFamily.primary,
                marginBottom: stat.change ? designTokens.spacing[2] : 0,
              }}>
                {stat.value}
              </div>

              {stat.change && (
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
                    {stat.change.value > 0 ? '↑' : '↓'} {Math.abs(stat.change.value)}%
                  </span>
                  <span style={{ color: designTokens.colors.text.tertiary }}>
                    {stat.change.label}
                  </span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
