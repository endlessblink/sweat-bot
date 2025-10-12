import { OllamaService, ChatMessage } from './aiService';
import axios from 'axios';

export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'google';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string;
  priority: number; // Lower number = higher priority
  enabled: boolean;
}

export interface MultiProviderChatRequest {
  messages: ChatMessage[];
  preferredProvider?: AIProvider;
  fallbackEnabled?: boolean;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface MultiProviderChatResponse {
  provider: AIProvider;
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export class MultiProviderAIService {
  private providers: Map<AIProvider, AIProviderConfig>;
  private ollamaService: OllamaService;

  constructor() {
    this.providers = new Map();
    this.ollamaService = new OllamaService();
    this.initializeProviders();
  }

  private initializeProviders() {
    // Ollama (local) - highest priority if available
    this.providers.set('ollama', {
      provider: 'ollama',
      model: process.env.OLLAMA_MODEL || 'llama2',
      baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
      priority: 1,
      enabled: process.env.ENABLE_LOCAL_AI !== 'false'
    });

    // OpenAI - second priority
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
        priority: 2,
        enabled: true
      });
    }

    // Anthropic - third priority
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', {
        provider: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
        baseUrl: 'https://api.anthropic.com/v1',
        priority: 3,
        enabled: true
      });
    }

    // Google AI - fourth priority
    if (process.env.GOOGLE_AI_KEY) {
      this.providers.set('google', {
        provider: 'google',
        apiKey: process.env.GOOGLE_AI_KEY,
        model: process.env.GOOGLE_MODEL || 'gemini-1.5-flash',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        priority: 4,
        enabled: true
      });
    }
  }

  /**
   * Get sorted list of available providers by priority
   */
  private async getAvailableProviders(): Promise<AIProviderConfig[]> {
    const available: AIProviderConfig[] = [];

    for (const [provider, config] of this.providers) {
      if (!config.enabled) continue;

      // Check if provider is actually available
      if (provider === 'ollama') {
        const isAvailable = await this.ollamaService.isAvailable();
        if (isAvailable) available.push(config);
      } else {
        // For cloud providers, assume available if API key is set
        if (config.apiKey) available.push(config);
      }
    }

    // Sort by priority
    return available.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Chat with automatic provider selection and fallback
   */
  async chat(request: MultiProviderChatRequest): Promise<MultiProviderChatResponse> {
    const availableProviders = await this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    // Try preferred provider first if specified
    if (request.preferredProvider) {
      const preferredConfig = this.providers.get(request.preferredProvider);
      if (preferredConfig?.enabled) {
        try {
          return await this.chatWithProvider(preferredConfig, request);
        } catch (error) {
          if (!request.fallbackEnabled) {
            throw error;
          }
          console.warn(`Preferred provider ${request.preferredProvider} failed, trying fallback...`);
        }
      }
    }

    // Try providers in priority order
    let lastError: Error | null = null;
    for (const providerConfig of availableProviders) {
      try {
        return await this.chatWithProvider(providerConfig, request);
      } catch (error) {
        lastError = error as Error;
        console.warn(`Provider ${providerConfig.provider} failed:`, error);

        if (!request.fallbackEnabled) {
          throw error;
        }
        // Continue to next provider
      }
    }

    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Chat with a specific provider
   */
  private async chatWithProvider(
    config: AIProviderConfig,
    request: MultiProviderChatRequest
  ): Promise<MultiProviderChatResponse> {
    const startTime = Date.now();

    switch (config.provider) {
      case 'ollama':
        return await this.chatWithOllama(config, request, startTime);
      case 'openai':
        return await this.chatWithOpenAI(config, request, startTime);
      case 'anthropic':
        return await this.chatWithAnthropic(config, request, startTime);
      case 'google':
        return await this.chatWithGoogle(config, request, startTime);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Chat with Ollama
   */
  private async chatWithOllama(
    config: AIProviderConfig,
    request: MultiProviderChatRequest,
    startTime: number
  ): Promise<MultiProviderChatResponse> {
    const response = await this.ollamaService.chat({
      model: config.model,
      messages: request.messages,
      stream: false,
      options: {
        temperature: request.temperature,
        num_predict: request.maxTokens
      }
    });

    return {
      provider: 'ollama',
      content: response.message.content,
      model: config.model,
      usage: {
        promptTokens: response.prompt_eval_count || 0,
        completionTokens: response.eval_count || 0,
        totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0)
      },
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Chat with OpenAI
   */
  private async chatWithOpenAI(
    config: AIProviderConfig,
    request: MultiProviderChatRequest,
    startTime: number
  ): Promise<MultiProviderChatResponse> {
    const response = await axios.post(
      `${config.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const choice = response.data.choices[0];
    return {
      provider: 'openai',
      content: choice.message.content,
      model: response.data.model,
      usage: {
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens
      },
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Chat with Anthropic Claude
   */
  private async chatWithAnthropic(
    config: AIProviderConfig,
    request: MultiProviderChatRequest,
    startTime: number
  ): Promise<MultiProviderChatResponse> {
    // Extract system message
    const systemMessage = request.messages.find(m => m.role === 'system');
    const messages = request.messages.filter(m => m.role !== 'system');

    const response = await axios.post(
      `${config.baseUrl}/messages`,
      {
        model: config.model,
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        })),
        system: systemMessage?.content,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature
      },
      {
        headers: {
          'x-api-key': config.apiKey!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      provider: 'anthropic',
      content: response.data.content[0].text,
      model: response.data.model,
      usage: {
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
      },
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Chat with Google Gemini
   */
  private async chatWithGoogle(
    config: AIProviderConfig,
    request: MultiProviderChatRequest,
    startTime: number
  ): Promise<MultiProviderChatResponse> {
    // Convert messages to Gemini format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    // Add system instruction if present
    const systemMessage = request.messages.find(m => m.role === 'system');

    const response = await axios.post(
      `${config.baseUrl}/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        contents,
        systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const candidate = response.data.candidates[0];
    return {
      provider: 'google',
      content: candidate.content.parts[0].text,
      model: config.model,
      usage: {
        promptTokens: response.data.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.data.usageMetadata?.totalTokenCount || 0
      },
      latencyMs: Date.now() - startTime
    };
  }

  /**
   * Get status of all providers
   */
  async getProvidersStatus(): Promise<Array<{
    provider: AIProvider;
    available: boolean;
    model: string;
    priority: number;
    error?: string;
  }>> {
    const statuses = [];

    for (const [provider, config] of this.providers) {
      if (!config.enabled) {
        statuses.push({
          provider,
          available: false,
          model: config.model,
          priority: config.priority,
          error: 'Provider disabled'
        });
        continue;
      }

      try {
        if (provider === 'ollama') {
          const available = await this.ollamaService.isAvailable();
          statuses.push({
            provider,
            available,
            model: config.model,
            priority: config.priority,
            error: available ? undefined : 'Ollama service not running'
          });
        } else {
          statuses.push({
            provider,
            available: !!config.apiKey,
            model: config.model,
            priority: config.priority,
            error: config.apiKey ? undefined : 'API key not configured'
          });
        }
      } catch (error) {
        statuses.push({
          provider,
          available: false,
          model: config.model,
          priority: config.priority,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return statuses.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Simple text generation with automatic provider selection
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    options?: {
      provider?: AIProvider;
      fallback?: boolean;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chat({
      messages,
      preferredProvider: options?.provider,
      fallbackEnabled: options?.fallback !== false,
      temperature: options?.temperature,
      maxTokens: options?.maxTokens
    });

    return response.content;
  }
}
