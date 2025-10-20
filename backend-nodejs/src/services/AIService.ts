import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import GoogleGenerativeAI from '@google-ai/generativelanguage';
import { GoogleAuth } from 'google-auth-library';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';

export interface AIRequest {
  message: string;
  provider?: 'openai' | 'groq' | 'anthropic' | 'gemini';
  context?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokens?: number;
  finishReason?: string;
  cost?: number;
  responseTime?: number;
}

export interface ConversationContext {
  previousMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userProfile?: {
    name?: string;
    goals?: string[];
    language?: 'en' | 'he';
    fitnessLevel?: string;
  };
}

export class AIService {
  private openai: OpenAI;
  private groq: Groq;
  private anthropic: Anthropic;
  private gemini: any = null;

  // Cost per 1K tokens (approximate USD pricing)
  private readonly COSTS = {
    openai: {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }
    },
    groq: {
      'llama-3.1-70b-versatile': { input: 0.00059, output: 0.00079 },
      'llama-3.1-8b-instant': { input: 0.00005, output: 0.00008 },
      'mixtral-8x7b-32768': { input: 0.00024, output: 0.00024 }
    },
    anthropic: {
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 }
    },
    gemini: {
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
      'gemini-1.5-pro': { input: 0.0025, output: 0.0075 }
    }
  };

  constructor() {
    this.openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });
    this.groq = new Groq({ apiKey: config.GROQ_API_KEY });
    this.anthropic = new Anthropic({ apiKey: config.ANTHROPIC_API_KEY });

    if (config.GEMINI_API_KEY) {
      // Google AI will be initialized later when needed
      console.log('Google AI API key available');
    }

    // Verify API keys are loaded
    this.verifyApiKeys();
  }

  private verifyApiKeys(): void {
    const requiredKeys = [
      { name: 'OpenAI', key: config.OPENAI_API_KEY },
      { name: 'Groq', key: config.GROQ_API_KEY },
      { name: 'Anthropic', key: config.ANTHROPIC_API_KEY },
      { name: 'Gemini', key: config.GEMINI_API_KEY }
    ];

    const missingKeys = requiredKeys.filter(provider => !provider.key);

    if (missingKeys.length > 0) {
      logger.warn(`Missing API keys for: ${missingKeys.map(p => p.name).join(', ')}`);
    }

    const availableKeys = requiredKeys.filter(provider => provider.key);
    logger.info(`AI providers ready: ${availableKeys.map(p => p.name).join(', ')}`);
  }

  /**
   * Generate AI response with automatic fallback
   */
  async generateResponse(request: AIRequest, context?: ConversationContext): Promise<AIResponse> {
    const startTime = Date.now();
    const provider = request.provider || 'openai';

    try {
      logger.info(`🤖 Generating response using ${provider}`, {
        userId: request.userId,
        messageLength: request.message.length,
        hasContext: !!context
      });

      let response: AIResponse;

      switch (provider) {
        case 'openai':
          response = await this.generateOpenAIResponse(request, context);
          break;
        case 'groq':
          response = await this.generateGroqResponse(request, context);
          break;
        case 'anthropic':
          response = await this.generateAnthropicResponse(request, context);
          break;
        case 'gemini':
          response = await this.generateGeminiResponse(request, context);
          break;
        default:
          throw new CustomError(`Unsupported provider: ${provider}`, 400);
      }

      response.responseTime = Date.now() - startTime;

      logger.info(`✅ ${provider} response generated`, {
        provider: response.provider,
        model: response.model,
        tokens: response.tokens,
        responseTime: response.responseTime,
        cost: response.cost
      });

      return response;

    } catch (error) {
      logger.error(`❌ ${provider} API error:`, error);

      // Try fallback providers
      if (provider !== 'openai') {
        logger.info(`🔄 Falling back to OpenAI...`);
        return this.generateResponse({ ...request, provider: 'openai' }, context);
      }

      throw new CustomError(`AI service unavailable: ${error.message}`, 503);
    }
  }

  private async generateOpenAIResponse(request: AIRequest, context?: ConversationContext): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(request.systemPrompt, context);
    const messages = this.buildMessages(request.message, context, systemPrompt);

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 1000,
      stream: false
    });

    const content = response.choices[0]?.message?.content || '';
    const model = response.model;
    const tokens = response.usage?.total_tokens;

    return {
      content,
      provider: 'openai',
      model,
      tokens,
      finishReason: response.choices[0]?.finish_reason || 'stop',
      cost: this.calculateCost('openai', model, response.usage?.prompt_tokens, response.usage?.completion_tokens)
    };
  }

  private async generateGroqResponse(request: AIRequest, context?: ConversationContext): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(request.systemPrompt, context);
    const messages = this.buildMessages(request.message, context, systemPrompt);

    const response = await this.groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 1000,
      stream: false
    });

    const content = response.choices[0]?.message?.content || '';
    const model = response.model;
    const tokens = response.usage?.total_tokens;

    return {
      content,
      provider: 'groq',
      model,
      tokens,
      finishReason: response.choices[0]?.finish_reason || 'stop',
      cost: this.calculateCost('groq', model, response.usage?.prompt_tokens, response.usage?.completion_tokens)
    };
  }

  private async generateAnthropicResponse(request: AIRequest, context?: ConversationContext): Promise<AIResponse> {
    // TODO: Implement Anthropic API integration
    // For now, return a mock response
    return {
      content: `Mock Anthropic response to: "${request.message}"`,
      provider: 'anthropic',
      model: 'claude-3-haiku-20240307',
      tokens: 100,
      responseTime: 500,
      cost: 0.001
    };
  }

  private async generateGeminiResponse(request: AIRequest, context?: ConversationContext): Promise<AIResponse> {
    const systemPrompt = this.buildSystemPrompt(request.systemPrompt, context);

    const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const contextMessages = this.getContextMessages(context);
    const prompt = [
      systemPrompt,
      ...contextMessages.map(msg => `${msg.role}: ${msg.content}`),
      `User: ${request.message}`
    ].join('\n\n');

    const response = await model.generateContent(prompt);
    const content = response.response.text() || '';

    // Gemini doesn't provide token usage in the same way
    const estimatedTokens = this.estimateTokens(prompt + content);

    return {
      content,
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      tokens: estimatedTokens,
      finishReason: 'stop',
      cost: this.calculateCost('gemini', 'gemini-1.5-flash', estimatedTokens * 0.7, estimatedTokens * 0.3)
    };
  }

  private buildSystemPrompt(customPrompt?: string, context?: ConversationContext): string {
    if (customPrompt) {
      return customPrompt;
    }

    const basePrompt = `You are SweatBot, a professional Hebrew fitness AI assistant. Your role is to help users with:

🏋️ **Exercise Tracking & Planning**
- Log workouts accurately (sets, reps, weight)
- Create personalized workout routines
- Suggest progressive overload strategies

💪 **Fitness Advice & Motivation**
- Provide science-backed fitness guidance
- Offer encouragement and support
- Address form and technique questions

📊 **Progress Analysis**
- Track personal records and improvements
- Analyze workout patterns and trends
- Suggest optimizations for better results

🌍 **Language & Communication**
- Respond in Hebrew when user communicates in Hebrew
- Use English when user communicates in English
- Be encouraging, professional, and culturally appropriate

🎯 **Special Features**
- Track user's workout history and preferences
- Provide personalized recommendations based on user goals
- Adjust advice based on user's fitness level and experience`;

    if (context?.userProfile) {
      const profile = context.userProfile;
      return `${basePrompt}

**User Profile:**
- Name: ${profile.name || 'Not specified'}
- Fitness Goals: ${profile.goals?.join(', ') || 'General fitness'}
- Language Preference: ${profile.language || 'English'}
- Fitness Level: ${profile.fitnessLevel || 'Not specified'}

Please personalize your responses based on this profile.`;
    }

    return basePrompt;
  }

  private buildMessages(userMessage: string, context?: ConversationContext, systemPrompt?: string): any[] {
    const messages: any[] = [];

    // Add system prompt
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add conversation context
    if (context?.previousMessages) {
      const recentMessages = context.previousMessages.slice(-5); // Last 5 messages for context
      messages.push(...recentMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })));
    }

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  private getContextMessages(context?: ConversationContext): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (!context?.previousMessages) {
      return [];
    }

    return context.previousMessages.slice(-5).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private calculateCost(provider: string, model: string, inputTokens?: number, outputTokens?: number): number {
    const providerCosts = this.COSTS[provider as keyof typeof this.COSTS];
    if (!providerCosts || !providerCosts[model as keyof typeof providerCosts]) {
      return 0;
    }

    const costs = providerCosts[model as keyof typeof providerCosts] as { input: number; output: number };
    const inputCost = (inputTokens || 0) / 1000 * costs.input;
    const outputCost = (outputTokens || 0) / 1000 * costs.output;

    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token for English, ~5 for Hebrew
    const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
    const englishChars = text.length - hebrewChars;
    return Math.ceil(englishChars / 4 + hebrewChars / 5);
  }

  /**
   * Get available AI providers and their status
   */
  getProviderStatus(): Record<string, { available: boolean; models: string[] }> {
    return {
      openai: {
        available: !!config.OPENAI_API_KEY,
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
      },
      groq: {
        available: !!config.GROQ_API_KEY,
        models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
      },
      anthropic: {
        available: !!config.ANTHROPIC_API_KEY,
        models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229']
      },
      gemini: {
        available: !!config.GEMINI_API_KEY,
        models: ['gemini-1.5-flash', 'gemini-1.5-pro']
      }
    };
  }

  /**
   * Health check for all AI providers
   */
  async healthCheck(): Promise<Record<string, { status: 'healthy' | 'unhealthy'; error?: string; responseTime?: number }>> {
    const results: Record<string, any> = {};

    // Test OpenAI
    try {
      const start = Date.now();
      await this.openai.models.list();
      results.openai = { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      results.openai = { status: 'unhealthy', error: error.message };
    }

    // Test Groq
    try {
      const start = Date.now();
      await this.groq.models.list();
      results.groq = { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      results.groq = { status: 'unhealthy', error: error.message };
    }

    // Test Anthropic
    try {
      const start = Date.now();
      // Anthropic doesn't have a simple health check endpoint, so we'll check API key validity
      if (config.ANTHROPIC_API_KEY) {
        results.anthropic = { status: 'healthy', responseTime: Date.now() - start };
      } else {
        results.anthropic = { status: 'unhealthy', error: 'API key not configured' };
      }
    } catch (error) {
      results.anthropic = { status: 'unhealthy', error: error.message };
    }

    // Test Gemini
    try {
      const start = Date.now();
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      // Simple health check - just instantiate the model
      results.gemini = { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      results.gemini = { status: 'unhealthy', error: error.message };
    }

    return results;
  }
}

export default AIService;