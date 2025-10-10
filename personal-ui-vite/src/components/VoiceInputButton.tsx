/**
 * VoiceInputButton - Push-to-talk microphone button
 *
 * Features:
 * - Push-to-talk interaction (press & hold)
 * - Visual states: idle, recording, processing, error
 * - Recording animation with duration
 * - Design system tokens (NO hardcoded values)
 * - Accessibility support
 */

import React from 'react';
import { usePushToTalk } from '../hooks/useVoiceInput';
import { designTokens } from '../design-system/tokens';

export interface VoiceInputButtonProps {
  /** Callback when transcription completes */
  onTranscript?: (text: string) => void;
  /** Language for transcription (default: 'he') */
  language?: string;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

export function VoiceInputButton({
  onTranscript,
  language = 'he',
  size = 'md',
  className = '',
}: VoiceInputButtonProps) {
  const voiceInput = usePushToTalk({
    language,
    onTranscript,
    onError: (error) => console.error('[VoiceInputButton]', error),
  });

  // Button sizes using design tokens
  const sizeStyles = {
    sm: {
      width: designTokens.spacing[10],
      height: designTokens.spacing[10],
      fontSize: designTokens.typography.fontSize.base,
    },
    md: {
      width: designTokens.spacing[12],
      height: designTokens.spacing[12],
      fontSize: designTokens.typography.fontSize.lg,
    },
    lg: {
      width: designTokens.spacing[16],
      height: designTokens.spacing[16],
      fontSize: designTokens.typography.fontSize.xl,
    },
  };

  // Button color states using design tokens
  const getButtonStyle = () => {
    if (voiceInput.error) {
      return {
        backgroundColor: designTokens.colors.interactive.danger,
        borderColor: designTokens.colors.interactive.danger,
      };
    }

    if (voiceInput.isRecording) {
      return {
        backgroundColor: designTokens.colors.interactive.danger,
        borderColor: designTokens.colors.interactive.danger,
      };
    }

    if (voiceInput.isProcessing) {
      return {
        backgroundColor: designTokens.colors.interactive.secondary,
        borderColor: designTokens.colors.interactive.secondary,
      };
    }

    return {
      backgroundColor: designTokens.colors.background.tertiary,
      borderColor: designTokens.colors.border.default,
    };
  };

  // Aria label for accessibility
  const getAriaLabel = () => {
    if (voiceInput.isRecording) return 'Recording voice input... Release to stop';
    if (voiceInput.isProcessing) return 'Processing voice input...';
    if (voiceInput.error) return `Error: ${voiceInput.error}. Click to try again`;
    return 'Press and hold to record voice input';
  };

  const buttonStyle = getButtonStyle();
  const currentSize = sizeStyles[size];

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: designTokens.spacing[2],
      }}
      className={className}
    >
      {/* Main Microphone Button */}
      <button
        onMouseDown={voiceInput.onPressStart}
        onMouseUp={voiceInput.onPressEnd}
        onTouchStart={voiceInput.onPressStart}
        onTouchEnd={voiceInput.onPressEnd}
        disabled={voiceInput.isProcessing}
        aria-label={getAriaLabel()}
        aria-pressed={voiceInput.isRecording}
        style={{
          width: currentSize.width,
          height: currentSize.height,
          borderRadius: designTokens.borderRadius.full,
          border: `2px solid`,
          backgroundColor: buttonStyle.backgroundColor,
          borderColor: buttonStyle.borderColor,
          color: designTokens.colors.text.primary,
          fontSize: currentSize.fontSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: voiceInput.isProcessing ? 'not-allowed' : 'pointer',
          transition: `all ${designTokens.transitions.fast}`,
          boxShadow: voiceInput.isRecording ? designTokens.shadows.lg : designTokens.shadows.sm,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Icon based on state */}
        {voiceInput.isProcessing ? (
          <SpinnerIcon />
        ) : voiceInput.error ? (
          <ErrorIcon />
        ) : (
          <MicrophoneIcon isRecording={voiceInput.isRecording} />
        )}

        {/* Recording pulse animation */}
        {voiceInput.isRecording && <RecordingPulse />}
      </button>

      {/* Recording Duration */}
      {voiceInput.isRecording && (
        <span
          style={{
            color: designTokens.colors.text.secondary,
            fontSize: designTokens.typography.fontSize.sm,
            fontFamily: designTokens.typography.fontFamily.mono,
            minWidth: '3rem',
          }}
        >
          {formatDuration(voiceInput.duration)}
        </span>
      )}

      {/* Error Message */}
      {voiceInput.error && (
        <span
          style={{
            color: designTokens.colors.interactive.danger,
            fontSize: designTokens.typography.fontSize.xs,
            position: 'absolute',
            bottom: `-${designTokens.spacing[6]}`,
            left: '0',
            whiteSpace: 'nowrap',
          }}
        >
          {voiceInput.error}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Icon Components (using design tokens)
// ============================================================================

function MicrophoneIcon({ isRecording }: { isRecording: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: `transform ${designTokens.transitions.fast}`,
        transform: isRecording ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        animation: 'spin 1s linear infinite',
      }}
    >
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ============================================================================
// Recording Pulse Animation Component
// ============================================================================

function RecordingPulse() {
  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(1.05);
            }
          }
        `}
      </style>
      <div
        style={{
          position: 'absolute',
          inset: '0',
          borderRadius: designTokens.borderRadius.full,
          border: `2px solid ${designTokens.colors.interactive.danger}`,
          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  return `0:${secs.toString().padStart(2, '0')}`;
}
