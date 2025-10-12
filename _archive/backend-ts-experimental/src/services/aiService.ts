import axios, { AxiosInstance } from 'axios';

export interface AIModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
  };
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:11434') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 60000, // 60 second timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if Ollama service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('/api/tags', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of available models
   */
  async listModels(): Promise<AIModel[]> {
    try {
      const response = await this.client.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      throw new Error(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if a specific model is available
   */
  async hasModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      return models.some(model => model.name === modelName);
    } catch (error) {
      return false;
    }
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(modelName: string, onProgress?: (status: string) => void): Promise<void> {
    try {
      const response = await this.client.post('/api/pull', {
        name: modelName,
        stream: true
      }, {
        responseType: 'stream',
        timeout: 300000, // 5 minute timeout for model pulling
      });

      // Handle streaming response for progress updates
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status && onProgress) {
              onProgress(data.status);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch (parseError) {
            // Ignore parsing errors for progress updates
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a chat completion
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post('/api/chat', {
        model: request.model,
        messages: request.messages,
        stream: false,
        options: request.options || {}
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw new Error(`Model '${request.model}' not found. Please pull it first.`);
      }
      throw new Error(`Chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a streaming chat completion
   */
  async chatStream(
    request: ChatRequest,
    onChunk: (chunk: string) => void,
    onComplete: (response: ChatResponse) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await this.client.post('/api/chat', {
        model: request.model,
        messages: request.messages,
        stream: true,
        options: request.options || {}
      }, {
        responseType: 'stream',
        timeout: 120000, // 2 minute timeout for streaming
      });

      let fullContent = '';
      let finalResponse: ChatResponse | null = null;

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.message?.content) {
              const content = data.message.content;
              fullContent += content;
              onChunk(content);
            }

            if (data.done) {
              finalResponse = {
                model: data.model,
                created_at: data.created_at,
                message: {
                  role: 'assistant',
                  content: fullContent
                },
                done: true,
                total_duration: data.total_duration,
                prompt_eval_count: data.prompt_eval_count,
                prompt_eval_duration: data.prompt_eval_duration,
                eval_count: data.eval_count,
                eval_duration: data.eval_duration
              };
              onComplete(finalResponse);
            }

            if (data.error) {
              onError(new Error(data.error));
              return;
            }
          } catch (parseError) {
            // Ignore parsing errors for streaming data
          }
        }
      });

      response.data.on('error', (error: Error) => {
        onError(error);
      });

      response.data.on('end', () => {
        if (!finalResponse && fullContent) {
          // Fallback for cases where done flag might be missing
          onComplete({
            model: request.model,
            created_at: new Date().toISOString(),
            message: {
              role: 'assistant',
              content: fullContent
            },
            done: true
          });
        }
      });
    } catch (error) {
      onError(new Error(`Stream chat request failed: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  /**
   * Generate text (simplified interface)
   */
  async generate(
    prompt: string,
    model: string = 'llama2',
    systemPrompt?: string,
    options?: ChatRequest['options']
  ): Promise<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await this.chat({
      model,
      messages,
      options
    });

    return response.message.content;
  }

  /**
   * Get system information
   */
  async getSystemInfo(): Promise<any> {
    try {
      const response = await this.client.get('/api/version');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get system info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check with detailed status
   */
  async getHealthStatus(): Promise<{
    available: boolean;
    models: AIModel[];
    error?: string;
  }> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        return {
          available: false,
          models: [],
          error: 'Ollama service is not available'
        };
      }

      const models = await this.listModels();
      return {
        available: true,
        models
      };
    } catch (error) {
      return {
        available: false,
        models: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}