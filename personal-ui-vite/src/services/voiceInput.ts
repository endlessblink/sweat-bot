/**
 * Voice Input Service - Speech-to-Text with Provider Abstraction
 *
 * Supports multiple STT providers with automatic fallback:
 * - Groq Whisper (primary - fast & cheap)
 * - OpenAI Whisper (fallback - reliable)
 * - Web Speech API (browser fallback - free)
 *
 * Easy provider switching via .env configuration
 */

// ============================================================================
// Provider Interface
// ============================================================================

export interface STTProvider {
  name: string;
  transcribe(audioBlob: Blob, language?: string): Promise<string>;
}

// ============================================================================
// Backend STT Provider (Primary - Uses Official Groq SDK on Server)
// ============================================================================

export class BackendSTTProvider implements STTProvider {
  name = 'Backend STT (Groq SDK)';

  private getBackendUrl(): string {
    // Import dynamically to avoid circular dependencies
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.host}`;
      }
    }
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  async transcribe(audioBlob: Blob, language: string = 'he'): Promise<string> {
    const backendUrl = this.getBackendUrl();
    const formData = new FormData();

    // MOBILE-SPECIFIC: Enhanced file extension detection for mobile audio formats
    let fileExt: string;

    if (audioBlob.type.includes('webm')) {
      fileExt = 'webm';
    } else if (audioBlob.type.includes('ogg')) {
      fileExt = 'ogg';
    } else if (audioBlob.type.includes('mp4')) {
      fileExt = 'm4a';  // Use .m4a for MP4 audio
    } else if (audioBlob.type.includes('aac')) {
      fileExt = 'm4a';  // AAC codec -> .m4a extension
    } else if (audioBlob.type.includes('mpeg')) {
      fileExt = 'mp3';  // MPEG codec -> .mp3 extension
    } else {
      // MOBILE-SPECIFIC: Fallback based on user agent for mobile devices
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/.test(navigator.userAgent);

      if (isIOS) {
        fileExt = 'm4a';  // iOS almost always produces AAC/M4A
        console.log(`[BackendSTT] iOS detected - using .m4a extension fallback`);
      } else if (isAndroid) {
        fileExt = 'webm'; // Android typically supports WebM
        console.log(`[BackendSTT] Android detected - using .webm extension fallback`);
      } else {
        fileExt = 'webm'; // Default fallback
        console.log(`[BackendSTT] Unknown mobile type - using .webm extension fallback`);
      }
    }

    console.log(`🌐 [BackendSTT] Transcription request:`);
    console.log(`   URL: ${backendUrl}/api/v1/stt/transcribe`);
    console.log(`   Blob size: ${audioBlob.size} bytes`);
    console.log(`   Blob type: ${audioBlob.type} → ${fileExt}`);
    console.log(`   Language: ${language}`);

    // CRITICAL: Validate audio blob before sending to backend
    if (audioBlob.size === 0) {
      const errorMsg = '❌ [BackendSTT] Empty audio blob - cannot transcribe';
      console.error(errorMsg);
      throw new Error('Audio recording failed - empty file');
    }

    if (audioBlob.size < 1024) {
      console.warn(`⚠️ [BackendSTT] Very small audio blob (${audioBlob.size} bytes) - transcription may fail`);
    }

    // Mobile-optimized FormData preparation
    const isAndroid = /Android.*Chrome/.test(navigator.userAgent);
    const fileObj = isAndroid
      ? new File([audioBlob], `recording.${fileExt}`, { type: audioBlob.type })
      : audioBlob;

    if (isAndroid) {
      console.log(`📱 [BackendSTT] Using Android-compatible File object`);
    }

    // Append file with proper mobile compatibility
    formData.append('file', fileObj, `audio.${fileExt}`);
    formData.append('language', language);
    formData.append('model', 'whisper-large-v3');
    formData.append('temperature', 0);  // Most accurate - send as number, not string

    // Hebrew fitness terminology prompt
    const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
    formData.append('prompt', hebrewPrompt);

    console.log('📤 [BackendSTT] Sending request...');
    const startTime = performance.now();

    // Add mobile timeout handling
    const timeout = 15000; // 15 seconds for mobile
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('📱 [BackendSTT] Request timeout - aborting');
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(`${backendUrl}/api/v1/stt/transcribe`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Don't set Content-Type header - let browser set multipart boundary
      });

      clearTimeout(timeoutId);
      const responseTime = performance.now() - startTime;
      console.log(`📥 [BackendSTT] Response received in ${responseTime.toFixed(0)}ms, status: ${response.status}`);

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ [BackendSTT] HTTP ${response.status} error:`, error);
        throw new Error(`Backend STT error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('✅ [BackendSTT] Transcription successful!');
      console.log(`   Text: "${result.text}"`);
      console.log(`   Language: ${result.language}`);
      console.log(`   Duration: ${result.duration}s`);
      return result.text;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        console.error('📱 [BackendSTT] Request timed out after 15 seconds');
        throw new Error('Mobile transcription timeout - please try again');
      }

      throw error;
    }
  }
}

// ============================================================================
// Groq Whisper Provider (Direct API - Fallback)
// ============================================================================

export class GroqWhisperProvider implements STTProvider {
  name = 'Groq Whisper';
  private apiKey: string;
  private baseUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';

  constructor() {
    this.apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_GROQ_API_KEY not found in environment');
    }
  }

  async transcribe(audioBlob: Blob, language: string = 'he'): Promise<string> {
    const formData = new FormData();
    // Use correct file extension based on blob type
    const fileExt = audioBlob.type.includes('webm') ? 'webm' :
                    audioBlob.type.includes('ogg') ? 'ogg' :
                    audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
    console.log(`[Groq] Sending audio as audio.${fileExt}, type: ${audioBlob.type}`);
    formData.append('file', audioBlob, `audio.${fileExt}`);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', language);

    // CRITICAL: temperature=0 for most accurate, deterministic transcription
    formData.append('temperature', '0');

    // Hebrew fitness terminology prompt to guide the model
    // Place key terms at END of prompt (last ~5 words matter most)
    const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
    formData.append('prompt', hebrewPrompt);

    formData.append('response_format', 'verbose_json');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq Whisper API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('[Groq] Response format:', result.task || 'transcribe', 'language:', result.language);
    return result.text;
  }
}

// ============================================================================
// OpenAI Whisper Provider (Fallback)
// ============================================================================

export class OpenAIWhisperProvider implements STTProvider {
  name = 'OpenAI Whisper';
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/audio/transcriptions';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('VITE_OPENAI_API_KEY not found in environment');
    }
  }

  async transcribe(audioBlob: Blob, language: string = 'he'): Promise<string> {
    const formData = new FormData();
    // Use correct file extension based on blob type
    const fileExt = audioBlob.type.includes('webm') ? 'webm' :
                    audioBlob.type.includes('ogg') ? 'ogg' :
                    audioBlob.type.includes('mp4') ? 'm4a' : 'webm';
    console.log(`[OpenAI] Sending audio as audio.${fileExt}, type: ${audioBlob.type}`);
    formData.append('file', audioBlob, `audio.${fileExt}`);
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    // CRITICAL: temperature=0 for most accurate, deterministic transcription
    formData.append('temperature', '0');

    // Hebrew fitness terminology prompt to guide the model
    const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
    formData.append('prompt', hebrewPrompt);

    formData.append('response_format', 'verbose_json');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI Whisper API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('[OpenAI] Response format:', result.task || 'transcribe', 'language:', result.language);
    return result.text;
  }
}

// ============================================================================
// Web Speech API Provider (Browser Fallback)
// ============================================================================

export class WebSpeechProvider implements STTProvider {
  name = 'Web Speech API';

  async transcribe(audioBlob: Blob, language: string = 'he-IL'): Promise<string> {
    return new Promise((resolve, reject) => {
      // Check browser support
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Note: Web Speech API uses live microphone, not audio blob
      // This is a limitation of the browser API
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        reject(new Error(`Web Speech API error: ${event.error}`));
      };

      recognition.start();
    });
  }
}

// ============================================================================
// Provider Factory
// ============================================================================

export function getSTTProvider(name: string): STTProvider {
  switch (name.toLowerCase()) {
    case 'backend':
    case 'backend-stt':
      return new BackendSTTProvider();

    case 'groq':
    case 'groq-whisper':
      return new GroqWhisperProvider();

    case 'openai':
    case 'openai-whisper':
      return new OpenAIWhisperProvider();

    case 'web-speech':
    case 'browser':
      return new WebSpeechProvider();

    default:
      throw new Error(`Unknown STT provider: ${name}`);
  }
}

// ============================================================================
// Voice Input Service with Fallback Chain
// ============================================================================

export interface VoiceInputConfig {
  primaryProvider?: string;
  fallbackProviders?: string[];
  language?: string;
  maxRetries?: number;
}

export class VoiceInputService {
  private primaryProvider: STTProvider;
  private fallbackProviders: STTProvider[];
  private language: string;
  private maxRetries: number;

  constructor(config: VoiceInputConfig = {}) {
    // Get configuration from env or use defaults
    const primaryProviderName = config.primaryProvider ||
                                 import.meta.env.VITE_STT_PROVIDER ||
                                 'backend';  // Use backend (official Groq SDK) by default

    const fallbackChain = config.fallbackProviders ||
                          (import.meta.env.VITE_STT_FALLBACK_CHAIN || 'openai,web-speech').split(',');

    this.language = config.language || 'he';
    this.maxRetries = config.maxRetries || 3;

    // Initialize providers
    try {
      this.primaryProvider = getSTTProvider(primaryProviderName);
    } catch (error) {
      console.warn(`Failed to initialize primary provider ${primaryProviderName}:`, error);
      // Use first fallback as primary
      this.primaryProvider = getSTTProvider(fallbackChain[0]);
      fallbackChain.shift();
    }

    this.fallbackProviders = fallbackChain
      .map(name => {
        try {
          return getSTTProvider(name.trim());
        } catch (error) {
          console.warn(`Failed to initialize fallback provider ${name}:`, error);
          return null;
        }
      })
      .filter((provider): provider is STTProvider => provider !== null);
  }

  /**
   * Transcribe audio with automatic fallback chain
   */
  async transcribe(audioBlob: Blob, language?: string): Promise<string> {
    const providers = [this.primaryProvider, ...this.fallbackProviders];
    const targetLanguage = language || this.language;

    for (const provider of providers) {
      try {
        console.log(`[VoiceInput] Trying ${provider.name}...`);
        const startTime = performance.now();

        const transcript = await provider.transcribe(audioBlob, targetLanguage);

        const latency = performance.now() - startTime;
        console.log(`[VoiceInput] ✓ ${provider.name} succeeded in ${latency.toFixed(0)}ms`);
        console.log(`[VoiceInput] Transcript: "${transcript}"`);

        return transcript;
      } catch (error) {
        console.warn(`[VoiceInput] ✗ ${provider.name} failed:`, error);
        // Continue to next provider
      }
    }

    throw new Error('All STT providers failed');
  }

  /**
   * Get current provider information
   */
  getProviderInfo(): { primary: string; fallbacks: string[] } {
    return {
      primary: this.primaryProvider.name,
      fallbacks: this.fallbackProviders.map(p => p.name),
    };
  }
}

// ============================================================================
// Audio Recording Utilities
// ============================================================================

export interface RecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isProcessingStop = false; // Safari double-event guard
  private hasStarted = false; // Prevent multiple starts
  private recordingId: string | null = null; // Unique session tracking

  /**
   * Request microphone permission and start recording
   */
  async startRecording(options: RecordingOptions = {}): Promise<void> {
    // Prevent multiple simultaneous starts
    if (this.hasStarted || this.isProcessingStop) {
      console.warn('[AudioRecorder] Recording already in progress or stopping');
      return;
    }

    try {
      // Generate unique recording session ID
      this.recordingId = `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[AudioRecorder] Starting recording session: ${this.recordingId}`);

      this.hasStarted = true;

      // MOBILE-SPECIFIC: Request microphone access with mobile constraints
      const isMobile = /Mobile|Android|iPhone/.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      // Mobile-specific audio constraints
      const mobileConstraints = {
        audio: isIOS ? {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        } : {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: isMobile ? 16000 : 44100, // Lower sample rate for mobile
        }
      };

      console.log(`[AudioRecorder] Using ${isIOS ? 'iOS' : (isMobile ? 'mobile' : 'desktop')} audio constraints`);

      // Request microphone access with mobile-optimized constraints
      this.stream = await navigator.mediaDevices.getUserMedia(mobileConstraints);

      // MOBILE-SPECIFIC: Force stream to be active on mobile
      if (isMobile) {
        // Force audio tracks to be enabled on mobile browsers
        this.stream.getAudioTracks().forEach(track => {
          track.enabled = true;
          console.log(`[AudioRecorder] Mobile audio track enabled: ${track.label}, state: ${track.readyState}`);
        });
      }

      // Determine best mime type with mobile fallbacks
      const mimeType = options.mimeType || this.getBestMimeType();

      // MOBILE-SPECIFIC: Create MediaRecorder with mobile optimizations
      const recorderOptions: MediaRecorderOptions = {
        mimeType,
      };

      // Only add audioBitsPerSecond on non-iOS mobile (iOS doesn't support this option)
      if (!isIOS && options.audioBitsPerSecond) {
        recorderOptions.audioBitsPerSecond = isMobile ? 32000 : (options.audioBitsPerSecond || 128000);
      }

      this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);

      // Reset chunks
      this.audioChunks = [];
      let dataEventCount = 0; // Track data events

      // Collect audio data with mobile-specific logging
      this.mediaRecorder.ondataavailable = (event) => {
        dataEventCount++;
        console.log(`[AudioRecorder] Data available event #${dataEventCount} for ${this.recordingId}, size: ${event.data.size} bytes`);

        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        } else {
          console.warn(`[AudioRecorder] Empty chunk received on event #${dataEventCount}`);
        }
      };

      // Wait for recording to actually start with mobile timeout handling
      await new Promise<void>((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder not initialized'));
          return;
        }

        // Set up start handler with mobile-specific logging
        this.mediaRecorder.onstart = () => {
          console.log(`[AudioRecorder] Recording started: ${this.recordingId} with ${mimeType}`);
          console.log(`[AudioRecorder] Mobile state: ${isMobile ? 'mobile' : 'desktop'}, chunks: 0`);
          resolve();
        };

        // Set up error handler with detailed mobile error logging
        this.mediaRecorder.onerror = (event) => {
          const error = (event as any).error || new Error('MediaRecorder error');
          console.error(`[AudioRecorder] Recording error for ${this.recordingId}:`, {
            error: error.message,
            name: error.name,
            mobile: isMobile,
            ios: isIOS,
            mimeType,
            recorderState: this.mediaRecorder?.state
          });
          reject(new Error(`MediaRecorder error: ${error.message}`));
        };

        // MOBILE-SPECIFIC: Use different start strategies for mobile
        if (isIOS) {
          // iOS: Start without timeslice (iOS handles this poorly)
          console.log(`[AudioRecorder] iOS detected - starting without timeslice`);
          this.mediaRecorder.start();
        } else {
          // Android/Other mobile: Use longer timeslice
          const isAndroid = /Android.*Chrome/.test(navigator.userAgent);
          const timeslice = isAndroid ? 3000 : (isMobile ? 2000 : 100);
          console.log(`[AudioRecorder] Using ${timeslice}ms timeslice for ${isAndroid ? 'Android' : (isMobile ? 'mobile' : 'desktop')}`);
          this.mediaRecorder.start(timeslice);
        }

        // Mobile needs longer timeout for initialization
        const mobileTimeout = isMobile ? 5000 : 2000;
        setTimeout(() => {
          if (this.mediaRecorder?.state !== 'recording') {
            reject(new Error(`Recording start timeout after ${mobileTimeout}ms - state: ${this.mediaRecorder?.state}`));
          }
        }, mobileTimeout);
      });
    } catch (error) {
      this.cleanup();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[AudioRecorder] Failed to start recording: ${errorMessage}`);
      throw new Error(`Failed to start recording: ${errorMessage}`);
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    // Critical: Prevent Safari double-stop processing
    if (this.isProcessingStop || !this.mediaRecorder || !this.recordingId) {
      console.warn('[AudioRecorder] Stop already processing or no active recording');
      return new Blob([], { type: 'audio/webm' });
    }

    this.isProcessingStop = true;
    const sessionId = this.recordingId;
    const isMobile = /Mobile|Android|iPhone/.test(navigator.userAgent);
    console.log(`[AudioRecorder] Stopping recording session: ${sessionId} (mobile: ${isMobile})`);

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        this.isProcessingStop = false;
        reject(new Error('No active recording'));
        return;
      }

      let hasResolved = false; // Prevent double resolution

      this.mediaRecorder.onstop = () => {
        if (hasResolved) {
          console.warn(`[AudioRecorder] Double stop event detected for ${sessionId} - ignoring`);
          return;
        }

        hasResolved = true;
        console.log(`[AudioRecorder] Stop event processed for ${sessionId}`);

        // MOBILE-SPECIFIC: Mobile browsers often create small or empty chunks
        console.log(`[AudioRecorder] Processing ${this.audioChunks.length} audio chunks for mobile compatibility`);

        // Combine chunks into single blob
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });

        console.log(`[AudioRecorder] Recording stopped, blob size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);

        // MOBILE-SPECIFIC: Enhanced validation for mobile recordings
        if (audioBlob.size === 0) {
          console.error(`[AudioRecorder] ❌ Empty audio blob detected - mobile recording failed`);
          this.cleanup();
          reject(new Error('Mobile audio recording failed - empty file created'));
          return;
        }

        // Mobile recordings can be very small but still valid - use lower threshold
        const mobileMinSize = isMobile ? 100 : 1024; // 100 bytes minimum for mobile
        if (audioBlob.size < mobileMinSize) {
          console.warn(`[AudioRecorder] ⚠️ Very small ${isMobile ? 'mobile' : 'desktop'} audio blob (${audioBlob.size} bytes) - may be invalid`);

          // On mobile, try to continue with very small recordings rather than failing
          if (audioBlob.size < 50) {
            this.cleanup();
            reject(new Error(`Audio recording too small: ${audioBlob.size} bytes`));
            return;
          }
        }

        // MOBILE-SPECIFIC: Additional mobile validation
        if (isMobile && this.audioChunks.length === 0) {
          console.error(`[AudioRecorder] ❌ Mobile recording failed - no chunks collected`);
          this.cleanup();
          reject(new Error('Mobile recording failed - no audio data collected'));
          return;
        }

        // Mobile-specific success logging
        console.log(`[AudioRecorder] ✅ Mobile recording successful: ${audioBlob.size} bytes from ${this.audioChunks.length} chunks`);

        // Clean up
        this.cleanup();

        resolve(audioBlob);
      };

      // MOBILE-SPECIFIC: Mobile browsers may need more time to finalize recording
      const mobileTimeout = isMobile ? 8000 : 5000; // 8 seconds for mobile, 5 for desktop

      const stopTimeout = setTimeout(() => {
        if (!hasResolved) {
          console.error(`[AudioRecorder] Stop timeout for ${sessionId} after ${mobileTimeout}ms`);

          // MOBILE-SPECIFIC: Try to recover on mobile by creating blob from available chunks
          if (isMobile && this.audioChunks.length > 0) {
            console.warn(`[AudioRecorder] Mobile timeout recovery - creating blob from ${this.audioChunks.length} chunks`);
            const recoveryBlob = new Blob(this.audioChunks, {
              type: this.mediaRecorder?.mimeType || 'audio/webm',
            });

            hasResolved = true;
            this.cleanup();

            if (recoveryBlob.size > 50) {
              console.log(`[AudioRecorder] ✅ Mobile recovery successful: ${recoveryBlob.size} bytes`);
              resolve(recoveryBlob);
            } else {
              reject(new Error('Mobile recording timeout - recovery blob too small'));
            }
          } else {
            hasResolved = true;
            this.cleanup();
            reject(new Error(`Stop recording timeout after ${mobileTimeout}ms`));
          }
        }
      }, mobileTimeout);

      // MOBILE-SPECIFIC: Force stop on mobile browsers that hang
      if (isMobile && this.mediaRecorder.state === 'recording') {
        console.log(`[AudioRecorder] Forcing mobile stop`);
        this.mediaRecorder.stop();
      } else {
        this.mediaRecorder.stop();
      }

      // Clear timeout when resolved (wrap original resolve)
      const originalResolve = resolve;
      resolve = (blob: Blob) => {
        clearTimeout(stopTimeout);
        originalResolve(blob);
      };
    });
  }

  /**
   * Cancel recording without returning blob
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.hasStarted &&
           this.mediaRecorder !== null &&
           this.mediaRecorder.state === 'recording' &&
           !this.isProcessingStop;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    console.log(`[AudioRecorder] Cleaning up session: ${this.recordingId}`);

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
    this.hasStarted = false;
    this.isProcessingStop = false;
    this.recordingId = null;
  }

  /**
   * Get best supported mime type for recording
   * Mobile browsers have very specific codec requirements and compatibility issues
   */
  private getBestMimeType(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = /Mobile|Android|iPhone/.test(navigator.userAgent);

    console.log(`[AudioRecorder] Detecting best codec for: iOS=${isIOS}, Safari=${isSafari}, Android=${isAndroid}, Mobile=${isMobile}`);

    // iOS Safari: Very limited codec support, must use mp4/aac
    if (isIOS) {
      const iosTypes = [
        'audio/mp4;codecs=mp4a',   // Most reliable for iOS
        'audio/mp4',                // iOS fallback
        'audio/mp4;codecs=aac',     // AAC codec (may not work on all iOS versions)
      ];

      for (const type of iosTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log(`[AudioRecorder] Using iOS-optimized codec: ${type}`);
          return type;
        }
      }

      console.warn('[AudioRecorder] No iOS-compatible codecs found, forcing audio/mp4');
      return 'audio/mp4'; // iOS almost always supports basic mp4
    }

    // Android Chrome: WebM support varies by device, prioritize compatibility
    if (isAndroid) {
      const androidTypes = [
        'audio/webm;codecs=opus',   // Modern Android
        'audio/webm',               // Android fallback
        'audio/ogg;codecs=opus',    // Some Android devices
        'audio/mp4',                // Universal fallback
      ];

      for (const type of androidTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log(`[AudioRecorder] Using Android-optimized codec: ${type}`);
          return type;
        }
      }

      console.warn('[AudioRecorder] No Android-compatible codecs found, using audio/mp4');
      return 'audio/mp4';
    }

    // Safari Desktop: Different codec preferences
    if (isSafari) {
      const safariTypes = [
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm',
      ];

      for (const type of safariTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log(`[AudioRecorder] Using Safari-optimized codec: ${type}`);
          return type;
        }
      }
    }

    // Standard mobile browsers (not iOS/Android specific)
    if (isMobile) {
      const mobileTypes = [
        'audio/webm;codecs=opus',   // Modern mobile
        'audio/webm',               // Basic webm
        'audio/ogg;codecs=opus',    // Alternative
        'audio/mp4',                // Universal fallback
      ];

      for (const type of mobileTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          console.log(`[AudioRecorder] Using mobile-optimized codec: ${type}`);
          return type;
        }
      }

      console.warn('[AudioRecorder] No mobile codecs found, using audio/mp4');
      return 'audio/mp4';
    }

    // Desktop browsers - use optimal codec quality
    const desktopTypes = [
      'audio/webm;codecs=opus',   // Best quality for desktop
      'audio/webm',               // Basic webm
      'audio/ogg;codecs=opus',    // Alternative
      'audio/mp4',                // Fallback
    ];

    for (const type of desktopTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`[AudioRecorder] Using desktop codec: ${type}`);
        return type;
      }
    }

    console.warn('[AudioRecorder] No preferred codec supported, using webm fallback');
    return 'audio/webm'; // Final fallback
  }
}

// ============================================================================
// Singleton Instance (for easy import)
// ============================================================================

export const voiceInputService = new VoiceInputService();
export const audioRecorder = new AudioRecorder();
