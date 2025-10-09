import { FastifyPluginAsync } from 'fastify';
import { ApiResponse } from '../types';
import { OllamaService, ChatRequest, ChatMessage } from '../services/aiService';
import { MultiProviderAIService, AIProvider } from '../services/multiProviderAI';
import { authenticate } from '../middleware/auth';

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  const ollamaService = new OllamaService();
  const multiProviderService = new MultiProviderAIService();

  // GET /ai/health - Check AI service health
  fastify.get('/health', async (request, reply) => {
    try {
      const status = await ollamaService.getHealthStatus();

      return reply.send({
        success: status.available,
        data: {
          available: status.available,
          modelCount: status.models.length,
          models: status.models.map(m => ({ name: m.name, size: m.size })),
          error: status.error
        },
        message: status.available ? 'AI service is available' : 'AI service is not available',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // GET /ai/models - List available models
  fastify.get('/models', async (request, reply) => {
    try {
      const models = await ollamaService.listModels();

      return reply.send({
        success: true,
        data: {
          models,
          count: models.length
        },
        message: 'Models retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list models',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /ai/models/:modelName/pull - Pull a new model
  fastify.post<{ Params: { modelName: string } }>('/models/:modelName/pull', {
    preHandler: [authenticate],
    schema: {
      params: {
        type: 'object',
        required: ['modelName'],
        properties: {
          modelName: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { modelName } = request.params;

      // Check if model already exists
      const hasModel = await ollamaService.hasModel(modelName);
      if (hasModel) {
        return reply.send({
          success: true,
          message: `Model '${modelName}' is already available`,
          timestamp: new Date().toISOString()
        } as ApiResponse);
      }

      // Pull the model with progress updates
      let progress = '';
      await ollamaService.pullModel(modelName, (status) => {
        progress = status;
      });

      return reply.send({
        success: true,
        data: { modelName, finalStatus: progress },
        message: `Model '${modelName}' pulled successfully`,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to pull model',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /ai/chat - Generate chat completion
  fastify.post<{ Body: ChatRequest; Reply: ApiResponse<{ content: string }> }>('/chat', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['model', 'messages'],
        properties: {
          model: { type: 'string', minLength: 1 },
          messages: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                content: { type: 'string', minLength: 1 }
              }
            }
          },
          stream: { type: 'boolean', default: false },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              top_p: { type: 'number', minimum: 0, maximum: 1 },
              top_k: { type: 'integer', minimum: 0 },
              repeat_penalty: { type: 'number', minimum: 0, maximum: 2 },
              seed: { type: 'integer' },
              num_predict: { type: 'integer', minimum: 1 }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const response = await ollamaService.chat(request.body);

      return reply.send({
        success: true,
        data: {
          content: response.message.content,
          model: response.model,
          done: response.done,
          stats: {
            total_duration: response.total_duration,
            prompt_eval_count: response.prompt_eval_count,
            eval_count: response.eval_count
          }
        },
        message: 'Chat completed successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: error instanceof Error ? error.message : 'Chat request failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /ai/generate - Simple text generation
  fastify.post<{
    Body: {
      prompt: string;
      model?: string;
      systemPrompt?: string;
      options?: any;
    };
    Reply: ApiResponse<{ text: string }>
  }>('/generate', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          model: { type: 'string', default: 'llama2' },
          systemPrompt: { type: 'string' },
          options: {
            type: 'object',
            properties: {
              temperature: { type: 'number', minimum: 0, maximum: 2 },
              top_p: { type: 'number', minimum: 0, maximum: 1 },
              top_k: { type: 'integer', minimum: 0 },
              repeat_penalty: { type: 'number', minimum: 0, maximum: 2 },
              seed: { type: 'integer' },
              num_predict: { type: 'integer', minimum: 1 }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { prompt, model = 'llama2', systemPrompt, options } = request.body;
      const text = await ollamaService.generate(prompt, model, systemPrompt, options);

      return reply.send({
        success: true,
        data: { text },
        message: 'Text generated successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      return reply.status(statusCode).send({
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // WebSocket endpoint for streaming chat
  fastify.get('/chat-stream', { websocket: true }, (connection, req) => {
    connection.socket.on('message', async (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        const { model, messages, options } = data as ChatRequest;

        await ollamaService.chatStream(
          { model, messages, options },
          (chunk) => {
            connection.socket.send(JSON.stringify({
              type: 'chunk',
              content: chunk
            }));
          },
          (response) => {
            connection.socket.send(JSON.stringify({
              type: 'complete',
              response: {
                content: response.message.content,
                model: response.model,
                done: response.done
              }
            }));
          },
          (error) => {
            connection.socket.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          }
        );
      } catch (error) {
        connection.socket.send(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Invalid request'
        }));
      }
    });

    connection.socket.on('close', () => {
      // Handle cleanup if needed
    });
  });

  // ========================================
  // Multi-Provider AI Endpoints
  // ========================================

  // GET /ai/providers/status - Get status of all AI providers
  fastify.get('/providers/status', async (request, reply) => {
    try {
      const statuses = await multiProviderService.getProvidersStatus();

      return reply.send({
        success: true,
        data: {
          providers: statuses,
          availableCount: statuses.filter(p => p.available).length,
          totalCount: statuses.length
        },
        message: 'Provider status retrieved successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get provider status',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /ai/smart-chat - Multi-provider chat with automatic fallback
  fastify.post<{
    Body: {
      messages: ChatMessage[];
      provider?: AIProvider;
      fallback?: boolean;
      temperature?: number;
      maxTokens?: number;
    };
    Reply: ApiResponse<any>
  }>('/smart-chat', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['messages'],
        properties: {
          messages: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              required: ['role', 'content'],
              properties: {
                role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                content: { type: 'string', minLength: 1 }
              }
            }
          },
          provider: {
            type: 'string',
            enum: ['ollama', 'openai', 'anthropic', 'google']
          },
          fallback: { type: 'boolean', default: true },
          temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
          maxTokens: { type: 'integer', minimum: 1, maximum: 4096, default: 1024 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { messages, provider, fallback = true, temperature, maxTokens } = request.body;

      const response = await multiProviderService.chat({
        messages,
        preferredProvider: provider,
        fallbackEnabled: fallback,
        temperature,
        maxTokens
      });

      return reply.send({
        success: true,
        data: {
          content: response.content,
          provider: response.provider,
          model: response.model,
          usage: response.usage,
          latencyMs: response.latencyMs
        },
        message: 'Chat completed successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Multi-provider chat failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });

  // POST /ai/smart-generate - Simple text generation with auto provider selection
  fastify.post<{
    Body: {
      prompt: string;
      systemPrompt?: string;
      provider?: AIProvider;
      fallback?: boolean;
      temperature?: number;
      maxTokens?: number;
    };
    Reply: ApiResponse<{ text: string; provider: AIProvider; latencyMs: number }>
  }>('/smart-generate', {
    preHandler: [authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['prompt'],
        properties: {
          prompt: { type: 'string', minLength: 1 },
          systemPrompt: { type: 'string' },
          provider: {
            type: 'string',
            enum: ['ollama', 'openai', 'anthropic', 'google']
          },
          fallback: { type: 'boolean', default: true },
          temperature: { type: 'number', minimum: 0, maximum: 2, default: 0.7 },
          maxTokens: { type: 'integer', minimum: 1, maximum: 4096, default: 512 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { prompt, systemPrompt, provider, fallback = true, temperature, maxTokens } = request.body;

      const text = await multiProviderService.generate(prompt, systemPrompt, {
        provider,
        fallback,
        temperature,
        maxTokens
      });

      // Get the actual provider used (from the response)
      const response = await multiProviderService.chat({
        messages: systemPrompt
          ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: prompt }]
          : [{ role: 'user', content: prompt }],
        preferredProvider: provider,
        fallbackEnabled: fallback,
        temperature,
        maxTokens
      });

      return reply.send({
        success: true,
        data: {
          text: response.content,
          provider: response.provider,
          latencyMs: response.latencyMs
        },
        message: 'Text generated successfully',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }
  });
};

export default aiRoutes;