/**
 * AI Client Service
 * Secure client for backend AI proxy - NO API keys in frontend!
 */

import { getOrCreateGuestToken } from '../utils/auth';

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
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  }

  /**
   * Send chat completion request to backend AI proxy
   * All API keys are managed server-side - completely secure!
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const token = await getOrCreateGuestToken();

      const response = await fetch(`${this.baseUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (response.status === 429) {
        // Rate limit exceeded
        const error = await response.json();
        throw new RateLimitException(error.detail.message, error.detail.retry_after);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'AI service error');
      }

      const data: ChatResponse = await response.json();
      console.log(`✅ AI response from ${data.provider}/${data.model} - ${data.usage.total_tokens} tokens`);

      return data;
    } catch (error) {
      if (error instanceof RateLimitException) {
        throw error;  // Re-throw rate limit errors
      }

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

      const response = await fetch(`${this.baseUrl}/api/v1/ai/models`, {
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

      const response = await fetch(`${this.baseUrl}/api/v1/ai/usage/stats`, {
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
