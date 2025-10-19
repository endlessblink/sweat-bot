import { Request, Response } from 'express';
import { aiProviderService, ChatMessage, AIResponse } from '../../services/aiProviderService';
import { logger } from '../../utils/logger';

export interface ChatRequest {
  message: string;
  provider?: 'openai' | 'groq' | 'gemini' | 'anthropic';
  conversationHistory?: ChatMessage[];
  userId?: string;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    provider: string;
    model: string;
    tokens: number;
    responseTime: number;
  };
  error?: string;
  timestamp: string;
}

export class ChatController {
  public async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { message, provider = 'openai', conversationHistory = [], userId }: ChatRequest = req.body;

      // Validate input
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Message is required and must be a non-empty string',
          timestamp: new Date().toISOString(),
        } as ChatResponse);
        return;
      }

      if (message.length > 2000) {
        res.status(400).json({
          success: false,
          error: 'Message must be less than 2000 characters',
          timestamp: new Date().toISOString(),
        } as ChatResponse);
        return;
      }

      logger.info('Chat request received', {
        userId: userId || 'anonymous',
        messageLength: message.length,
        provider,
        conversationHistoryLength: conversationHistory.length,
      });

      // Generate AI response
      const aiResponse: AIResponse = await aiProviderService.generateResponse(
        message,
        conversationHistory,
        provider
      );

      if (aiResponse.success) {
        logger.info('AI response generated successfully', {
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          responseTime: aiResponse.responseTime,
        });

        res.json({
          success: true,
          data: {
            response: aiResponse.content,
            provider: aiResponse.provider,
            model: aiResponse.model,
            tokens: aiResponse.tokens,
            responseTime: aiResponse.responseTime,
          },
          timestamp: new Date().toISOString(),
        } as ChatResponse);
      } else {
        logger.error('AI response generation failed', {
          provider,
          error: aiResponse.error,
        });

        res.status(500).json({
          success: false,
          error: aiResponse.error || 'Failed to generate AI response',
          timestamp: new Date().toISOString(),
        } as ChatResponse);
      }
    } catch (error) {
      logger.error('Chat endpoint error:', error);

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      } as ChatResponse);
    }
  }

  public async getProvidersHealth(req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await aiProviderService.healthCheck();

      res.json({
        success: true,
        data: {
          providers: healthStatus,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Health check error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to check AI providers health',
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const chatController = new ChatController();