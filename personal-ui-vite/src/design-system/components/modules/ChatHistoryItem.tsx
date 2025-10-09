import React from 'react';
import { designTokens } from '../../tokens';

export interface ChatHistoryItemProps {
  title: string;
  preview: string;
  timestamp: Date;
  icon?: string;
  active?: boolean;
  onClick?: () => void;
}

/**
 * ChatHistoryItem Component
 *
 * WHERE TO USE: src/components/ui/ChatHistorySidebar.tsx
 *
 * Individual conversation item in chat history sidebar.
 * Shows title, preview, and timestamp with emoji icon.
 *
 * @example
 * <ChatHistoryItem
 *   title="אימון בוקר"
 *   preview="עשיתי 20 סקוואטים ו-15 שכיבות סמיכה"
 *   timestamp={new Date()}
 *   icon="💪"
 *   onClick={() => loadConversation(id)}
 * />
 */
export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = ({
  title,
  preview,
  timestamp,
  icon = '💬',
  active = false,
  onClick,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    padding: designTokens.spacing[3],
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: active
      ? designTokens.colors.background.tertiary
      : isHovered
      ? designTokens.colors.background.tertiary
      : 'transparent',
    cursor: 'pointer',
    transition: `all ${designTokens.transitions.fast}`,
    marginBottom: designTokens.spacing[2],
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing[2],
    marginBottom: designTokens.spacing[1],
  };

  const titleStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.text.primary,
    fontFamily: designTokens.typography.fontFamily.primary,
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const previewStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    fontFamily: designTokens.typography.fontFamily.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: designTokens.spacing[1],
  };

  const timestampStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    fontFamily: designTokens.typography.fontFamily.primary,
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'אתמול';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString('he-IL', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      style={containerStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={headerStyle}>
        <span style={{ fontSize: designTokens.typography.fontSize.base }}>{icon}</span>
        <span style={titleStyle}>{title}</span>
      </div>
      <div style={previewStyle}>{preview}</div>
      <div style={timestampStyle}>{formatTimestamp(timestamp)}</div>
    </div>
  );
};
