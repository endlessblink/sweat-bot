/**
 * useVoiceInput Hook - React state management for voice input
 *
 * Manages recording state, microphone permissions, and transcription
 * Integrates with VoiceInputService for STT processing
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceInputService, audioRecorder } from '../services/voiceInput';
import { mobileDebug } from '../utils/mobileDebugger';

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

  // Refs for stable callbacks
  const durationIntervalRef = useRef<number | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const optionsRef = useRef(options);
  const recordingStateRef = useRef({ isRecording: false, isProcessing: false });

  // Update refs when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  // Sync state with refs
  useEffect(() => {
    recordingStateRef.current = { isRecording, isProcessing };
  }, [isRecording, isProcessing]);

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
   * Start recording - Memoized with stable refs
   */
  const startRecording = useCallback(async () => {
    // Check current state from ref to avoid stale closures
    if (recordingStateRef.current.isRecording || recordingStateRef.current.isProcessing) {
      console.warn('[useVoiceInput] Already recording or processing');
      return;
    }

    mobileDebug.log('🎤 Starting voice recording...');
    try {
      setError(null);
      setTranscript(null);

      // Check permission first
      if (hasPermission === null) {
        mobileDebug.log('🎤 Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
        mobileDebug.success('✅ Microphone permission granted');
      }

      // Start recording
      mobileDebug.log('🎤 Calling audioRecorder.startRecording()...');
      await audioRecorder.startRecording();
      mobileDebug.success('✅ Recording started successfully');

      setIsRecording(true);
      mobileDebug.log('✅ Voice recording state updated');

      // Start duration counter
      recordingStartTimeRef.current = Date.now();
      durationIntervalRef.current = window.setInterval(() => {
        if (recordingStartTimeRef.current) {
          const elapsed = (Date.now() - recordingStartTimeRef.current) / 1000;
          setDuration(elapsed);
        }
      }, 100); // Update every 100ms

      console.log('✅ [useVoiceInput] Recording fully started and ready');
    } catch (err) {
      console.error('❌ [useVoiceInput] Failed to start recording:', err);
      setError('Failed to start recording');

      if (optionsRef.current.onError) {
        optionsRef.current.onError(err as Error);
      }
    }
  }, [hasPermission]); // Minimal dependencies - most accessed via refs

  /**
   * Stop recording and transcribe - Memoized with stable refs
   */
  const stopRecording = useCallback(async () => {
    if (!recordingStateRef.current.isRecording) {
      console.warn('[useVoiceInput] Not currently recording');
      return;
    }

    mobileDebug.log('🛑 Stopping voice recording...');
    try {
      // Check if actually recording
      const isCurrentlyRecording = audioRecorder.isRecording();
      mobileDebug.log(`🔍 Checking recording state: ${isCurrentlyRecording}`);

      if (!isCurrentlyRecording) {
        mobileDebug.warn('⚠️ Stop called but not recording yet - waiting 200ms...');
        // Wait a bit for recording to start
        await new Promise(resolve => setTimeout(resolve, 200));

        // Check again
        const isRecordingNow = audioRecorder.isRecording();
        mobileDebug.log(`🔍 After wait, recording state: ${isRecordingNow}`);

        if (!isRecordingNow) {
          mobileDebug.error('❌ Still not recording - cancelling stop');
          setIsRecording(false);
          setDuration(0);
          return;
        }
      }

      mobileDebug.success('✅ Recording confirmed, proceeding to stop...');
      setIsRecording(false);
      setIsProcessing(true);

      // Stop duration counter
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      recordingStartTimeRef.current = null;

      // Get audio blob
      const audioBlob = await audioRecorder.stopRecording();
      mobileDebug.log('📦 Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type,
        isAndroid: /Android.*Chrome/.test(navigator.userAgent)
      });

      // Check if blob has data
      if (audioBlob.size === 0) {
        const error = 'No audio data recorded - microphone may not be working';
        mobileDebug.error('❌ Empty audio blob detected');
        setError(error);
        throw new Error(error);
      }

      mobileDebug.success('✅ Audio blob valid, starting transcription...');

      // Auto-transcribe if enabled
      if (optionsRef.current.autoTranscribe) {
        try {
          mobileDebug.log('🎯 Calling transcription service...');
          const text = await voiceInputService.transcribe(
            audioBlob,
            optionsRef.current.language || 'he'
          );

          mobileDebug.success('📝 Transcription completed:', {
            text,
            textLength: text.length,
            language: optionsRef.current.language || 'he'
          });

          setTranscript(text);
          setDuration(0);

          // Callback
          if (optionsRef.current.onTranscript && text) {
            mobileDebug.log('📤 Calling onTranscript callback...');
            optionsRef.current.onTranscript(text);
            mobileDebug.success('✅ onTranscript callback executed successfully');
          } else {
            mobileDebug.warn('⚠️ No callback or empty text:', {
              hasCallback: !!optionsRef.current.onTranscript,
              textLength: text?.length
            });
          }

          mobileDebug.success('🎉 Voice transcription flow completed!');
        } catch (transcribeError) {
          console.error('❌ [useVoiceInput] Transcription failed:', transcribeError);
          const errorMessage = transcribeError instanceof Error ? transcribeError.message : 'Transcription failed';
          setError(`Transcription error: ${errorMessage}`);

          if (optionsRef.current.onError) {
            optionsRef.current.onError(transcribeError as Error);
          }
        }
      } else {
        console.warn('⚠️ [useVoiceInput] autoTranscribe is disabled');
      }
    } catch (err) {
      console.error('[useVoiceInput] Failed to stop recording:', err);
      setError('Failed to stop recording');
      setDuration(0);

      if (optionsRef.current.onError) {
        optionsRef.current.onError(err as Error);
      }
    } finally {
      setIsProcessing(false);
    }
  }, []); // Empty dependencies - all state accessed via refs

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
 * Includes mobile touch event debouncing to prevent double-firing
 */
export function usePushToTalk(options: UseVoiceInputOptions = {}) {
  const voiceInput = useVoiceInput(options);
  const touchTimeoutRef = useRef<number | null>(null);
  const lastTouchTime = useRef<number>(0);
  const isProcessingTouch = useRef<boolean>(false);

  // Debounced start handler to prevent double-taps
  const handlePressStart = useCallback(async (event?: Event) => {
    const now = Date.now();

    // Prevent rapid double-taps (common on Android/mobile)
    if (now - lastTouchTime.current < 200) {
      console.log('[usePushToTalk] Ignoring rapid double-tap');
      return;
    }

    // Prevent multiple simultaneous processing
    if (isProcessingTouch.current) {
      console.log('[usePushToTalk] Already processing touch start');
      return;
    }

    isProcessingTouch.current = true;
    lastTouchTime.current = now;

    // Clear any pending timeout
    if (touchTimeoutRef.current) {
      window.clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    try {
      console.log('👆 [usePushToTalk] BUTTON PRESSED (debounced)');

      // Prevent default to avoid mobile browser conflicts
      if (event) {
        event.preventDefault();
      }

      await voiceInput.startRecording();
      console.log('👆 [usePushToTalk] startRecording() completed');
    } catch (error) {
      console.error('[usePushToTalk] Start recording error:', error);
    } finally {
      isProcessingTouch.current = false;
    }
  }, [voiceInput]);

  // Debounced end handler with small delay
  const handlePressEnd = useCallback(async (event?: Event) => {
    // Clear any existing timeout
    if (touchTimeoutRef.current) {
      window.clearTimeout(touchTimeoutRef.current);
    }

    // Debounce end events with 50ms delay
    touchTimeoutRef.current = window.setTimeout(async () => {
      if (isProcessingTouch.current) {
        console.log('[usePushToTalk] Still processing start - delaying end');
        return;
      }

      isProcessingTouch.current = true;

      try {
        console.log('👇 [usePushToTalk] BUTTON RELEASED (debounced)');

        if (event) {
          event.preventDefault();
        }

        await voiceInput.stopRecording();
        console.log('👇 [usePushToTalk] stopRecording() completed');
      } catch (error) {
        console.error('[usePushToTalk] Stop recording error:', error);
      } finally {
        isProcessingTouch.current = false;
        touchTimeoutRef.current = null;
      }
    }, 50); // 50ms debounce for end events
  }, [voiceInput]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        window.clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...voiceInput,
    onPressStart: handlePressStart,
    onPressEnd: handlePressEnd,
  };
}
