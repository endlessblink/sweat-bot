/**
 * useVoiceInput Hook - React state management for voice input
 *
 * Manages recording state, microphone permissions, and transcription
 * Integrates with VoiceInputService for STT processing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceInputService, audioRecorder } from '../services/voiceInput';

export interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  error: string | null;
  hasPermission: boolean | null;
  duration: number; // Recording duration in seconds
}

export interface UseVoiceInputReturn extends VoiceInputState {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  clearTranscript: () => void;
  clearError: () => void;
  requestPermission: () => Promise<boolean>;
}

export interface UseVoiceInputOptions {
  language?: string;
  autoTranscribe?: boolean; // Auto-transcribe when recording stops
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    language = 'he',
    autoTranscribe = true,
    onTranscript,
    onError,
  } = options;

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [duration, setDuration] = useState(0);

  // Refs
  const durationIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  /**
   * Request microphone permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Permission granted, clean up test stream
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (err) {
      console.error('[useVoiceInput] Permission denied:', err);
      setHasPermission(false);
      setError('Microphone permission denied');
      if (onError) onError(err as Error);
      return false;
    }
  }, [onError]);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript(null);

      // Check permission first
      if (hasPermission === null) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      // Start recording
      await audioRecorder.startRecording();
      setIsRecording(true);

      // Start duration counter
      recordingStartTimeRef.current = Date.now();
      durationIntervalRef.current = window.setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
          setDuration(elapsed);
        }
      }, 100); // Update every 100ms

      console.log('[useVoiceInput] Recording started');
    } catch (err) {
      console.error('[useVoiceInput] Failed to start recording:', err);
      setError('Failed to start recording');
      if (onError) onError(err as Error);
    }
  }, [hasPermission, requestPermission, onError]);

  /**
   * Stop recording and transcribe
   */
  const stopRecording = useCallback(async () => {
    try {
      setIsRecording(false);

      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      recordingStartTimeRef.current = null;

      // Get audio blob
      const audioBlob = await audioRecorder.stopRecording();
      console.log('[useVoiceInput] Recording stopped, blob size:', audioBlob.size);

      // Check if blob has data
      if (audioBlob.size === 0) {
        throw new Error('No audio data recorded');
      }

      // Auto-transcribe if enabled
      if (autoTranscribe) {
        setIsProcessing(true);

        try {
          const text = await voiceInputService.transcribe(audioBlob, language);
          setTranscript(text);
          setDuration(0);

          // Callback
          if (onTranscript && text) {
            onTranscript(text);
          }

          console.log('[useVoiceInput] Transcription completed:', text);
        } catch (transcribeError) {
          console.error('[useVoiceInput] Transcription failed:', transcribeError);
          setError('Transcription failed. Please try again.');
          if (onError) onError(transcribeError as Error);
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error('[useVoiceInput] Failed to stop recording:', err);
      setError('Failed to stop recording');
      setDuration(0);
      if (onError) onError(err as Error);
    }
  }, [autoTranscribe, language, onTranscript, onError]);

  /**
   * Cancel recording without transcription
   */
  const cancelRecording = useCallback(() => {
    setIsRecording(false);
    setIsProcessing(false);
    setDuration(0);

    // Stop duration counter
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    recordingStartTimeRef.current = null;

    // Cancel audio recorder
    audioRecorder.cancelRecording();

    console.log('[useVoiceInput] Recording cancelled');
  }, []);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioRecorder.isRecording()) {
        audioRecorder.cancelRecording();
      }
    };
  }, []);

  return {
    isRecording,
    isProcessing,
    transcript,
    error,
    hasPermission,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
    clearTranscript,
    clearError,
    requestPermission,
  };
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Push-to-talk hook - simplified interface for button press/release
 */
export function usePushToTalk(options: UseVoiceInputOptions = {}) {
  const voiceInput = useVoiceInput(options);

  const handlePressStart = useCallback(async () => {
    await voiceInput.startRecording();
  }, [voiceInput]);

  const handlePressEnd = useCallback(async () => {
    await voiceInput.stopRecording();
  }, [voiceInput]);

  return {
    ...voiceInput,
    onPressStart: handlePressStart,
    onPressEnd: handlePressEnd,
  };
}
