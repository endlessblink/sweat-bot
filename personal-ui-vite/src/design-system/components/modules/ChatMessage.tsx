import React from 'react';
import { designTokens } from '../../tokens';
import { Avatar } from '../base/Avatar';

export interface ChatMessageProps {
  content: string;
  sender: 'user' | 'bot';
  timestamp?: Date;
  userName?: string;
  userAvatar?: string;
}

/**
 * ChatMessage Component
 *
 * WHERE TO USE: src/components/SweatBotChat.tsx
 *
 * Chat message bubble with avatar and timestamp.
 * Automatically handles RTL for Hebrew text.
 *
 * @example
 * <ChatMessage
 *   content="עשיתי 20 סקוואטים"
 *   sender="user"
 *   userName="נועם"
 *   timestamp={new Date()}
 * />
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({
  content,
  sender,
  timestamp,
  userName,
  userAvatar,
}) => {
  const isUser = sender === 'user';

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: designTokens.spacing[3],
    marginBottom: designTokens.spacing[4],
    justifyContent: isUser ? 'flex-end' : 'flex-start',
    fontFamily: designTokens.typography.fontFamily.primary,
  };

  const messageStyle: React.CSSProperties = {
    maxWidth: designTokens.layout.messageMaxWidth,
    padding: designTokens.spacing[4],
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: isUser
      ? designTokens.colors.semantic.userMessage
      : designTokens.colors.semantic.botMessage,
    color: designTokens.colors.text.primary,
    fontSize: designTokens.typography.fontSize.base,
    lineHeight: designTokens.typography.lineHeight.normal,
  };

  const metaStyle: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    marginTop: designTokens.spacing[2],
  };

  return (
    <div style={containerStyle}>
      {!isUser && (
        <Avatar
          name="SweatBot"
          size="md"
          variant="circular"
        />
      )}
      <div style={{ flex: '1', maxWidth: designTokens.layout.messageMaxWidth }}>
        <div style={messageStyle}>
          <div>{content}</div>
          {timestamp && (
            <div style={metaStyle}>
              {timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <Avatar
          src={userAvatar}
          name={userName || 'User'}
          size="md"
          variant="circular"
        />
      )}
    </div>
  );
};
