/**
 * AI Client Service
 * Secure client for backend AI proxy - NO API keys in frontend!
 */

import { getOrCreateGuestToken } from '../utils/auth';
import { getBackendUrl } from '../utils/env';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

export interface ChatRequest {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
  model?: 'openai' | 'groq' | 'gemini';
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: string;
}

export interface RateLimitError {
  error: 'rate_limit_exceeded';
  message: string;
  retry_after: number;
}

class AIClient {
  private getBaseUrl(): string {
    return getBackendUrl();
  }

  /**
   * Send chat completion request to backend AI proxy
   * All API keys are managed server-side - completely secure!
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const token = await getOrCreateGuestToken();
      const baseUrl = this.getBaseUrl();

      // Debug logging for mobile troubleshooting
      console.log('[AI CLIENT] Starting chat request');
      console.log('[AI CLIENT] Base URL:', baseUrl);
      console.log('[AI CLIENT] Token exists:', !!token);
      console.log('[AI CLIENT] User Agent:', navigator.userAgent);

      const response = await fetch(`${baseUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(request)
      });

      console.log('[AI CLIENT] Response status:', response.status);
      console.log('[AI CLIENT] Response OK:', response.ok);

      if (response.status === 429) {
        // Rate limit exceeded
        const error = await response.json();
        throw new RateLimitException(error.detail.message, error.detail.retry_after);
      }

      if (!response.ok) {
        console.error('[AI CLIENT] Response not OK:', response.status, response.statusText);
        const error = await response.json();
        console.error('[AI CLIENT] Error body:', error);
        throw new Error(error.detail || 'AI service error');
      }

      const data: ChatResponse = await response.json();
      console.log(`✅ AI response from ${data.provider}/${data.model} - ${data.usage.total_tokens} tokens`);
      console.log('[AI CLIENT] Success - response received');

      return data;
    } catch (error) {
      if (error instanceof RateLimitException) {
        throw error;  // Re-throw rate limit errors
      }

      console.error('[AI CLIENT] Exception:', error);
      console.error('[AI CLIENT] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[AI CLIENT] Error message:', error instanceof Error ? error.message : String(error));
      console.error('AI client error:', error);
      throw new Error(error instanceof Error ? error.message : 'AI service unavailable');
    }
  }

  /**
   * Get list of available AI models
   */
  async getModels() {
    try {
      const token = await getOrCreateGuestToken();
      const baseUrl = this.getBaseUrl();

      const response = await fetch(`${baseUrl}/api/v1/ai/models`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch models');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get models:', error);
      return { models: [] };
    }
  }

  /**
   * Get usage statistics for current user
   */
  async getUsageStats() {
    try {
      const token = await getOrCreateGuestToken();
      const baseUrl = this.getBaseUrl();

      const response = await fetch(`${baseUrl}/api/v1/ai/usage/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return null;
    }
  }
}

/**
 * Custom exception for rate limit errors
 */
export class RateLimitException extends Error {
  constructor(public message: string, public retryAfter: number) {
    super(message);
    this.name = 'RateLimitException';
  }
}

// Singleton instance
export const aiClient = new AIClient();
