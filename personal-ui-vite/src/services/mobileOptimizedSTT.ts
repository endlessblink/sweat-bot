/**
 * Mobile-Optimized Speech-to-Text Provider
 *
 * Fixes Android Chrome FormData handling and mobile network timeout issues.
 * Based on research into mobile browser-specific network behavior.
 */

import { mobileDebug } from '../utils/mobileDebugger';

export interface STTProvider {
  name: string;
  transcribe(audioBlob: Blob, language?: string): Promise<string>;
}

export class MobileOptimizedSTTProvider implements STTProvider {
  name = 'Mobile-Optimized Backend STT';
  private timeout = 15000; // 15 second timeout for mobile
  private maxRetries = 2;

  private getBackendUrl(): string {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `${window.location.protocol}//${window.location.host}`;
      }
    }
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  private isAndroidChrome(): boolean {
    return /Android.*Chrome/.test(navigator.userAgent);
  }

  private async createMobileCompatibleFormData(audioBlob: Blob, language: string): Promise<FormData> {
    const formData = new FormData();

    // Critical: Android Chrome requires explicit file metadata
    const mimeType = audioBlob.type || 'audio/webm';
    const fileExt = mimeType.includes('webm') ? 'webm' :
                    mimeType.includes('ogg') ? 'ogg' :
                    mimeType.includes('mp4') ? 'm4a' : 'webm';

    // Create proper File object for Android Chrome compatibility
    const audioFile = new File([audioBlob], `recording.${fileExt}`, {
      type: mimeType,
      lastModified: Date.now()
    });

    mobileDebug.log('📱 Mobile FormData prep:', {
      originalSize: audioBlob.size,
      finalSize: audioFile.size,
      type: audioFile.type,
      name: audioFile.name,
      isAndroidChrome: this.isAndroidChrome()
    });

    formData.append('file', audioFile);
    formData.append('language', language);
    formData.append('model', 'whisper-large-v3');
    formData.append('temperature', '0');

    // Hebrew fitness terminology prompt
    const hebrewPrompt = 'תרגילים: סקוואטים, שכיבות סמיכה, מתיחות, ברפיס, דדליפט, ספסל, קילו, חזרות';
    formData.append('prompt', hebrewPrompt);

    return formData;
  }

  private async fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      mobileDebug.error('📱 Request timeout', { url, timeoutMs });
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async transcribe(audioBlob: Blob, language: string = 'he'): Promise<string> {
    const backendUrl = this.getBackendUrl();
    const url = `${backendUrl}/api/v1/stt/transcribe`;

    mobileDebug.log('🎙️ Starting mobile transcription:', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      url,
      isAndroid: this.isAndroidChrome(),
      userAgent: navigator.userAgent.substring(0, 100),
      language,
      timeout: this.timeout
    });

    // Validate blob before processing
    if (audioBlob.size === 0) {
      const error = 'Audio blob is empty';
      mobileDebug.error(error);
      throw new Error(error);
    }

    if (audioBlob.size > 25 * 1024 * 1024) { // 25MB limit
      const error = 'Audio blob too large for mobile upload';
      mobileDebug.error(error, { size: audioBlob.size });
      throw new Error(error);
    }

    let lastError: Error | null = null;

    // Retry logic for mobile network issues
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        mobileDebug.log(`📡 Transcription attempt ${attempt}/${this.maxRetries}`);

        const formData = await this.createMobileCompatibleFormData(audioBlob, language);

        mobileDebug.log('📤 FormData created, keys:', Array.from(formData.keys()));

        const startTime = performance.now();

        const response = await this.fetchWithTimeout(url, {
          method: 'POST',
          body: formData,
          // Don't set Content-Type - let browser set multipart boundary
          // Important for mobile compatibility
        }, this.timeout);

        const responseTime = Math.round(performance.now() - startTime);

        mobileDebug.log('📥 Response received:', {
          status: response.status,
          ok: response.ok,
          responseTime: `${responseTime}ms`,
          headers: {
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(`HTTP ${response.status}: ${errorText}`);
          mobileDebug.error('📱 HTTP Error:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
            responseTime: `${responseTime}ms`
          });
          throw error;
        }

        const result = await response.json();

        mobileDebug.success('🎉 Transcription successful!', {
          text: result.text,
          language: result.language,
          duration: result.duration,
          responseTime: `${responseTime}ms`
        });

        return result.text;

      } catch (error) {
        lastError = error as Error;
        const isNetworkError = error instanceof TypeError && error.message.includes('network');
        const isTimeoutError = error instanceof Error && error.name === 'AbortError';
        const isDOMException = error instanceof DOMException;

        mobileDebug.error(`📱 Attempt ${attempt} failed:`, {
          error: error instanceof Error ? error.message : String(error),
          type: error instanceof Error ? error.constructor.name : typeof error,
          name: error instanceof Error ? error.name : 'Unknown',
          isNetworkError,
          isTimeoutError,
          isDOMException,
          stack: error instanceof Error ? error.stack?.substring(0, 200) : 'No stack'
        });

        // Don't retry on certain errors
        if (!isNetworkError && !isTimeoutError && !isDOMException && attempt === 1) {
          mobileDebug.error('📱 Non-network error detected, not retrying');
          throw error;
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = 1000 * attempt;
          mobileDebug.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    mobileDebug.error('📱 All transcription attempts failed', lastError);
    throw lastError || new Error('Transcription failed after all retries');
  }
}

// Export for easy use
export const mobileOptimizedSTT = new MobileOptimizedSTTProvider();