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
  private backendUrl: string;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  async transcribe(audioBlob: Blob, language: string = 'he'): Promise<string> {
    const formData = new FormData();

    // Detect file extension
    const fileExt = audioBlob.type.includes('webm') ? 'webm' :
                    audioBlob.type.includes('ogg') ? 'ogg' :
                    audioBlob.type.includes('mp4') ? 'm4a' : 'webm';

    console.log(`[BackendSTT] Sending ${audioBlob.size} bytes to backend, language=${language}`);

    // Append file with correct extension
    formData.append('file', audioBlob, `audio.${fileExt}`);
    formData.append('language', language);
    formData.append('model', 'whisper-large-v3');
    formData.append('temperature', '0');  // Most accurate

    // Hebrew fitness terminology prompt
    const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
    formData.append('prompt', hebrewPrompt);

    const response = await fetch(`${this.backendUrl}/api/v1/stt/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Backend STT error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('[BackendSTT] Response:', result.language, 'duration:', result.duration);
    return result.text;
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

  /**
   * Request microphone permission and start recording
   */
  async startRecording(options: RecordingOptions = {}): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine best mime type
      const mimeType = options.mimeType || this.getBestMimeType();

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond || 128000,
      });

      // Reset chunks
      this.audioChunks = [];

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Wait for recording to actually start
      await new Promise<void>((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder not initialized'));
          return;
        }

        // Set up start handler
        this.mediaRecorder.onstart = () => {
          console.log('[AudioRecorder] Recording started with', mimeType);
          resolve();
        };

        // Set up error handler
        this.mediaRecorder.onerror = (event) => {
          console.error('[AudioRecorder] Recording error:', event);
          reject(new Error('MediaRecorder error'));
        };

        // Start recording
        this.mediaRecorder.start(100); // Collect data every 100ms

        // Timeout after 2 seconds
        setTimeout(() => reject(new Error('Recording start timeout')), 2000);
      });
    } catch (error) {
      this.cleanup();
      throw new Error(`Failed to start recording: ${error}`);
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Combine chunks into single blob
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || 'audio/webm',
        });

        // Clean up
        this.cleanup();

        console.log('[AudioRecorder] Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
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
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  /**
   * Get best supported mime type for recording
   */
  private getBestMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }
}

// ============================================================================
// Singleton Instance (for easy import)
// ============================================================================

export const voiceInputService = new VoiceInputService();
export const audioRecorder = new AudioRecorder();
