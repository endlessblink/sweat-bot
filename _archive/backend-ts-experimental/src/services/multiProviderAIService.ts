import { OllamaService, ChatMessage } from './aiService';

export interface AIProvider {
  name: 'ollama' | 'gemini' | 'groq' | 'openai';
  priority: number;
  available: boolean;
  costPerToken?: number;
}

export interface AIRequest {
  messages: ChatMessage[];
  model?: string;
  preferredProvider?: AIProvider['name'];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProvider['name'];
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  cached?: boolean;
}

export interface ProviderConfig {
  ollama: {
    enabled: boolean;
    baseUrl: string;
    defaultModel: string;
    priority: number;
  };
  gemini: {
    enabled: boolean;
    apiKey?: string;
    defaultModel: string;
    priority: number;
  };
  groq: {
    enabled: boolean;
    apiKey?: string;
    defaultModel: string;
    priority: number;
  };
  openai: {
    enabled: boolean;
    apiKey?: string;
    defaultModel: string;
    priority: number;
  };
}

export class MultiProviderAIService {
  private ollamaService: OllamaService;
  private config: ProviderConfig;
  private providerStatus: Map<AIProvider['name'], boolean>;

  constructor(config: Partial<ProviderConfig> = {}) {
    this.config = {
      ollama: {
        enabled: config.ollama?.enabled ?? true,
        baseUrl: config.ollama?.baseUrl ?? 'http://localhost:11434',
        defaultModel: config.ollama?.defaultModel ?? 'llama2',
        priority: config.ollama?.priority ?? 1
      },
      gemini: {
        enabled: config.gemini?.enabled ?? false,
        apiKey: config.gemini?.apiKey ?? process.env.GEMINI_API_KEY,
        defaultModel: config.gemini?.defaultModel ?? 'gemini-pro',
        priority: config.gemini?.priority ?? 2
      },
      groq: {
        enabled: config.groq?.enabled ?? false,
        apiKey: config.groq?.apiKey ?? process.env.GROQ_API_KEY,
        defaultModel: config.groq?.defaultModel ?? 'llama3-8b-8192',
        priority: config.groq?.priority ?? 3
      },
      openai: {
        enabled: config.openai?.enabled ?? false,
        apiKey: config.openai?.apiKey ?? process.env.OPENAI_API_KEY,
        defaultModel: config.openai?.defaultModel ?? 'gpt-3.5-turbo',
        priority: config.openai?.priority ?? 4
      }
    };

    this.ollamaService = new OllamaService(this.config.ollama.baseUrl);
    this.providerStatus = new Map();

    // Initialize provider status
    this.checkProviderAvailability();
  }

  /**
   * Check availability of all enabled providers
   */
  private async checkProviderAvailability(): Promise<void> {
    if (this.config.ollama.enabled) {
      const isAvailable = await this.ollamaService.isAvailable();
      this.providerStatus.set('ollama', isAvailable);
    }

    // Note: Actual cloud API availability checks would happen here
    // For now, we assume they're available if API keys are provided
    if (this.config.gemini.enabled && this.config.gemini.apiKey) {
      this.providerStatus.set('gemini', true);
    }

    if (this.config.groq.enabled && this.config.groq.apiKey) {
      this.providerStatus.set('groq', true);
    }

    if (this.config.openai.enabled && this.config.openai.apiKey) {
      this.providerStatus.set('openai', true);
    }
  }

  /**
   * Get list of available providers sorted by priority
   */
  async getAvailableProviders(): Promise<AIProvider[]> {
    await this.checkProviderAvailability();

    const providers: AIProvider[] = [];

    for (const [name, status] of this.providerStatus.entries()) {
      const config = this.config[name];
      if (config.enabled && status) {
        providers.push({
          name,
          priority: config.priority,
          available: status
        });
      }
    }

    // Sort by priority (lower number = higher priority)
    return providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Select the best provider based on request and availability
   */
  private async selectProvider(request: AIRequest): Promise<AIProvider['name']> {
    // If user prefers a specific provider and it's available, use it
    if (request.preferredProvider) {
      const isAvailable = this.providerStatus.get(request.preferredProvider);
      if (isAvailable) {
        return request.preferredProvider;
      }
    }

    // Otherwise, get the highest priority available provider
    const availableProviders = await this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error('No AI providers are currently available');
    }

    return availableProviders[0].name;
  }

  /**
   * Generate AI response using the best available provider
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const provider = await this.selectProvider(request);

    try {
      let content: string;
      let model: string;

      switch (provider) {
        case 'ollama':
          model = request.model || this.config.ollama.defaultModel;
          const ollamaResponse = await this.ollamaService.chat({
            model,
            messages: request.messages,
            options: {
              temperature: request.temperature,
              num_predict: request.maxTokens
            }
          });
          content = ollamaResponse.message.content;
          break;

        case 'gemini':
        case 'groq':
        case 'openai':
          // These would be implemented with their respective SDKs
          // For now, fall back to local model
          throw new Error(`Provider ${provider} not yet implemented, falling back to Ollama`);

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }

      const latencyMs = Date.now() - startTime;

      return {
        content,
        provider,
        model: model!,
        latencyMs
      };
    } catch (error) {
      // If the selected provider fails, try fallback
      if (provider !== 'ollama' && this.providerStatus.get('ollama')) {
        console.warn(`Provider ${provider} failed, falling back to Ollama`);
        return this.generate({ ...request, preferredProvider: 'ollama' });
      }
      throw error;
    }
  }

  /**
   * Generate streaming AI response
   */
  async generateStream(
    request: AIRequest,
    onChunk: (chunk: string, provider: AIProvider['name']) => void,
    onComplete: (response: AIResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const provider = await this.selectProvider(request);

      switch (provider) {
        case 'ollama':
          const model = request.model || this.config.ollama.defaultModel;
          let fullContent = '';

          await this.ollamaService.chatStream(
            {
              model,
              messages: request.messages,
              options: {
                temperature: request.temperature,
                num_predict: request.maxTokens
              }
            },
            (chunk) => {
              fullContent += chunk;
              onChunk(chunk, 'ollama');
            },
            (ollamaResponse) => {
              const latencyMs = Date.now() - startTime;
              onComplete({
                content: fullContent,
                provider: 'ollama',
                model,
                latencyMs
              });
            },
            onError
          );
          break;

        default:
          throw new Error(`Streaming not yet implemented for provider: ${provider}`);
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Health check for all providers
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    providers: {
      name: AIProvider['name'];
      available: boolean;
      config: any;
    }[];
  }> {
    await this.checkProviderAvailability();

    const providers = [];
    let healthyCount = 0;

    for (const [name, status] of this.providerStatus.entries()) {
      const config = this.config[name];
      providers.push({
        name,
        available: status,
        config: {
          enabled: config.enabled,
          priority: config.priority,
          model: config.defaultModel
        }
      });

      if (status) healthyCount++;
    }

    return {
      healthy: healthyCount > 0,
      providers
    };
  }

  /**
   * Get Ollama service for direct access
   */
  getOllamaService(): OllamaService {
    return this.ollamaService;
  }

  /**
   * Update provider configuration
   */
  updateConfig(newConfig: Partial<ProviderConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
    this.checkProviderAvailability();
  }

  /**
   * Get current configuration
   */
  getConfig(): ProviderConfig {
    return { ...this.config };
  }
}
