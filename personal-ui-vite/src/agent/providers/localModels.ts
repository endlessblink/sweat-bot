/**
 * Local Models Provider for Volt Agent
 * Connects to local models service at port 8006
 * Handles Whisper (Hebrew transcription) and Ollama (local LLM)
 */

export interface LocalModelsConfig {
  baseUrl?: string;
  timeout?: number;
}

export class LocalModelsProvider {
  private baseUrl: string;
  private timeout: number;
  
  constructor(config: LocalModelsConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:8006';
    this.timeout = config.timeout || 30000;
  }
  
  /**
   * Transcribe Hebrew audio using Whisper
   */
  async transcribe(audioData: Blob | ArrayBuffer): Promise<string> {
    try {
      const formData = new FormData();
      
      if (audioData instanceof Blob) {
        formData.append('audio', audioData, 'audio.webm');
      } else {
        formData.append('audio', new Blob([audioData]), 'audio.webm');
      }
      
      const response = await fetch(`${this.baseUrl}/transcribe`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }
  
  /**
   * Chat with local Ollama model (Gemma3n)
   */
  async chat(prompt: string, options?: any) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/local`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model: options?.model || 'bjoernb/gemma3n-e2b:latest',
          temperature: options?.temperature || 0.3,
          maxTokens: options?.maxTokens || 2048
        }),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Local chat failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      return {
        content: result.response,
        model: result.model || 'gemma3n-e2b',
        usage: result.usage
      };
    } catch (error) {
      console.error('Local chat error:', error);
      throw error;
    }
  }
  
  /**
   * Stream chat with local model
   */
  async *chatStream(prompt: string, options?: any) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/local/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model: options?.model || 'bjoernb/gemma3n-e2b:latest',
          temperature: options?.temperature || 0.3,
          stream: true
        }),
        signal: AbortSignal.timeout(this.timeout)
      });
      
      if (!response.ok) {
        throw new Error(`Local stream failed: ${response.statusText}`);
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          yield { content: '', done: true };
          break;
        }
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              yield {
                content: data.content || '',
                done: false
              };
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Local stream error:', error);
      throw error;
    }
  }
  
  /**
   * Check if local models service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(5000)
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
  
  /**
   * Get available local models
   */
  async getModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        return [];
      }
      
      const result = await response.json();
      return result.models || [];
    } catch {
      return [];
    }
  }
}