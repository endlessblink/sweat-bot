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

      // Transform the AI client request format to match chat/message endpoint
      const chatMessage = {
        message: request.messages[request.messages.length - 1]?.content || '', // Get the last user message
        model: 'bjoernb/gemma3n-e2b:latest', // Use the working Ollama model
        context: {},
        session_id: `frontend_${Date.now()}`
      };

      const response = await fetch(`${baseUrl}/chat/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify(chatMessage)
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

      const data = await response.json();
      console.log('[AI CLIENT] Success - response received');

      // Transform the chat/message response to match the expected ChatResponse format
      const transformedResponse: ChatResponse = {
        content: data.response,
        model: data.model_used || 'bjoernb/gemma3n-e2b:latest',
        provider: 'ollama',
        tool_calls: [],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        finish_reason: 'stop'
      };

      console.log(`✅ AI response from ${transformedResponse.provider}/${transformedResponse.model}`);
      return transformedResponse;
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
