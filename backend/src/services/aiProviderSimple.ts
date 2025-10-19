import OpenAI from 'openai';
import { Groq } from 'groq-sdk';
import { logger } from '../utils/logger';

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokens: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIProviderSimpleService {
  private openai: OpenAI | null = null;
  private groq: Groq | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      logger.info('OpenAI provider initialized');
    }

    // Initialize Groq
    if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      });
      logger.info('Groq provider initialized');
    }
  }

  private async callOpenAI(messages: ChatMessage[]): Promise<AIResponse> {
    if (!this.openai) {
      throw new Error('OpenAI provider not initialized');
    }

    const startTime = Date.now();

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const responseTime = Date.now() - startTime;

      return {
        content: completion.choices[0]?.message?.content || 'No response generated',
        provider: 'openai',
        model: 'gpt-4o-mini',
        tokens: completion.usage?.total_tokens || 0,
        responseTime,
        success: true,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('OpenAI API error:', error);
      return {
        content: '',
        provider: 'openai',
        model: 'gpt-4o-mini',
        tokens: 0,
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async callGroq(messages: ChatMessage[]): Promise<AIResponse> {
    if (!this.groq) {
      throw new Error('Groq provider not initialized');
    }

    const startTime = Date.now();

    try {
      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      const responseTime = Date.now() - startTime;

      return {
        content: completion.choices[0]?.message?.content || 'No response generated',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        tokens: completion.usage?.total_tokens || 0,
        responseTime,
        success: true,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Groq API error:', error);
      return {
        content: '',
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        tokens: 0,
        responseTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    preferredProvider: string = 'openai'
  ): Promise<AIResponse> {
    // Build system prompt for Hebrew/English fitness assistant
    const systemPrompt = `You are SweatBot, a Hebrew/English fitness AI assistant. You help users with:
1. Workout planning and exercise recommendations
2. Fitness goal setting and tracking
3. Exercise form and technique guidance
4. Motivation and support

Guidelines:
- Respond in the user's language (Hebrew or English)
- Be encouraging and supportive
- Provide specific, actionable advice
- Ask clarifying questions when needed
- Include exercise safety considerations
- Recommend consulting professionals for medical conditions

Keep responses concise but informative, under 200 words when possible.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: userMessage }
    ];

    // Try preferred provider first, then fallback to others
    const providers = this.getProviderOrder(preferredProvider);

    for (const provider of providers) {
      try {
        let response: AIResponse;

        switch (provider) {
          case 'openai':
            response = await this.callOpenAI(messages);
            break;
          case 'groq':
            response = await this.callGroq(messages);
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }

        if (response.success) {
          logger.info(`AI response generated using ${provider}`, {
            tokens: response.tokens,
            responseTime: response.responseTime,
          });
          return response;
        } else {
          logger.warn(`Provider ${provider} failed:`, response.error);
        }
      } catch (error) {
        logger.warn(`Provider ${provider} error:`, error);
      }
    }

    // All providers failed
    return {
      content: 'I apologize, but I\'m having trouble connecting to my AI services right now. Please try again in a moment.',
      provider: 'none',
      model: '',
      tokens: 0,
      responseTime: 0,
      success: false,
      error: 'All AI providers failed',
    };
  }

  private getProviderOrder(preferred: string): string[] {
    const availableProviders: string[] = [];

    if (this.openai) availableProviders.push('openai');
    if (this.groq) availableProviders.push('groq');

    // Put preferred provider first if available
    if (availableProviders.includes(preferred)) {
      const ordered = [preferred];
      ordered.push(...availableProviders.filter(p => p !== preferred));
      return ordered;
    }

    return availableProviders;
  }

  public async healthCheck(): Promise<{ provider: string; status: string }[]> {
    const healthChecks = [];

    if (this.openai) {
      try {
        await this.openai.models.list();
        healthChecks.push({ provider: 'openai', status: 'healthy' });
      } catch (error) {
        healthChecks.push({ provider: 'openai', status: 'unhealthy' });
      }
    }

    if (this.groq) {
      try {
        await this.groq.models.list();
        healthChecks.push({ provider: 'groq', status: 'healthy' });
      } catch (error) {
        healthChecks.push({ provider: 'groq', status: 'unhealthy' });
      }
    }

    return healthChecks;
  }
}

// Export singleton instance
export const aiProviderSimpleService = new AIProviderSimpleService();