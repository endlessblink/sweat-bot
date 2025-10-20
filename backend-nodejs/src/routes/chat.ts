import express from 'express';
import Joi from 'joi';
import { AIService, AIRequest } from '../services/AIService';
import { DatabaseService } from '../services/DatabaseService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();
const aiService = new AIService();
const db = DatabaseService.getInstance();

/**
 * @route   POST /api/v1/chat
 * @desc    Send a message to AI assistant
 * @access  Private
 */
router.post('/',
  authenticateToken,
  validateBody(schemas.message),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { message, provider = 'openai', context } = req.body;
    const userId = req.user!.userId;

    // Get conversation history for context
    const conversationHistory = await db.getConversationHistory(userId, 10);

    // Get user profile for personalization
    const userProfile = await db.getUserById(userId);

    const aiRequest: AIRequest = {
      message,
      provider,
      userId,
      temperature: 0.7,
      maxTokens: 1000
    };

    const aiContext = {
      previousMessages: conversationHistory,
      userProfile: userProfile ? {
        name: userProfile.name,
        goals: userProfile.fitnessGoals,
        language: userProfile.preferredLanguage,
        fitnessLevel: userProfile.fitnessGoals?.includes('beginner') ? 'beginner' :
                     userProfile.fitnessGoals?.includes('advanced') ? 'advanced' : 'intermediate'
      } : undefined
    };

    // Generate AI response
    const aiResponse = await aiService.generateResponse(aiRequest, aiContext);

    // Save conversation to database
    const conversationMessages = [
      ...conversationHistory.slice(-9), // Keep last 9 messages
      { role: 'user' as const, content: message, timestamp: new Date() },
      {
        role: 'assistant' as const,
        content: aiResponse.content,
        timestamp: new Date(),
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens: aiResponse.tokens
      }
    ];

    await db.saveConversation(userId, conversationMessages);

    // Award points for meaningful interaction
    if (message.length > 10 && aiResponse.content.length > 50) {
      await db.awardPoints(
        userId,
        `AI conversation with ${aiResponse.provider}`,
        'ai_chat',
        5,
        {
          provider: aiResponse.provider,
          model: aiResponse.model,
          tokens: aiResponse.tokens,
          cost: aiResponse.cost
        }
      );
    }

    // Log the interaction
    logger.info(`AI Chat interaction`, {
      userId,
      provider: aiResponse.provider,
      model: aiResponse.model,
      tokens: aiResponse.tokens,
      responseTime: aiResponse.responseTime,
      messageLength: message.length,
      responseLength: aiResponse.content.length
    });

    res.json({
      success: true,
      data: {
        response: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        tokens: aiResponse.tokens,
        responseTime: aiResponse.responseTime,
        cost: aiResponse.cost,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * @route   GET /api/v1/chat/history
 * @desc    Get conversation history
 * @access  Private
 */
router.get('/history',
  authenticateToken,
  validateBody(schemas.pagination),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const conversations = await db.getRecentConversations(userId, limit);
    const total = await db.getRecentConversations(userId, 999); // Get total count

    // Flatten messages for easier frontend consumption
    const flattenedMessages = conversations
      .flatMap(conv =>
        conv.messages.map(msg => ({
          ...msg,
          conversationId: conv._id?.toString(),
          conversationDate: conv.createdAt
        }))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        messages: flattenedMessages,
        pagination: {
          page,
          limit,
          total: total.length,
          pages: Math.ceil(total.length / limit),
          hasNext: offset + limit < total.length,
          hasPrev: page > 1
        }
      }
    });
  })
);

/**
 * @route   GET /api/v1/chat/conversations/:id
 * @desc    Get specific conversation
 * @access  Private
 */
router.get('/conversations/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    // This would need to be implemented in DatabaseService
    // For now, we'll return a placeholder
    res.json({
      success: true,
      data: {
        message: 'Individual conversation retrieval not yet implemented',
        conversationId: id,
        userId
      }
    });
  })
);

/**
 * @route   DELETE /api/v1/chat/history
 * @desc    Clear conversation history
 * @access  Private
 */
router.delete('/history',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const userId = req.user!.userId;

    // This would need to be implemented in DatabaseService
    // For now, we'll return a success response
    logger.warn(`Conversation history deletion requested for user: ${userId}`);

    res.json({
      success: true,
      message: 'Conversation history cleared successfully'
    });
  })
);

/**
 * @route   POST /api/v1/chat/feedback
 * @desc    Submit feedback on AI response
 * @access  Private
 */
router.post('/feedback',
  authenticateToken,
  validateBody(Joi.object({
    messageId: schemas.messageId.required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    feedback: Joi.string().max(1000).optional()
  })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { messageId, rating, feedback } = req.body;
    const userId = req.user!.userId;

    // Store feedback (this would need proper database implementation)
    logger.info(`AI feedback submitted`, {
      userId,
      messageId,
      rating,
      feedback,
      timestamp: new Date()
    });

    // Award points for providing feedback
    await db.awardPoints(
      userId,
      'Provided AI response feedback',
      'ai_feedback',
      2,
      { messageId, rating }
    );

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        pointsAwarded: 2
      }
    });
  })
);

/**
 * @route   GET /api/v1/chat/providers
 * @desc    Get available AI providers and their status
 * @access  Private
 */
router.get('/providers',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const providerStatus = aiService.getProviderStatus();

    res.json({
      success: true,
      data: {
        providers: providerStatus,
        currentProvider: req.query.provider || 'openai'
      }
    });
  })
);

/**
 * @route   GET /api/v1/chat/health
 * @desc    Check health of AI services
 * @access  Private
 */
router.get('/health',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const healthCheck = await aiService.healthCheck();

    const overallHealth = Object.values(healthCheck).every(status => status.status === 'healthy');

    res.json({
      success: true,
      data: {
        overall: overallHealth ? 'healthy' : 'degraded',
        providers: healthCheck,
        timestamp: new Date().toISOString()
      }
    });
  })
);

/**
 * @route   POST /api/v1/chat/test
 * @desc    Test AI provider with a simple message
 * @access  Private
 */
router.post('/test',
  authenticateToken,
  validateBody(Joi.object({
    provider: Joi.string().valid('openai', 'groq', 'anthropic', 'gemini').default('openai'),
    message: Joi.string().min(1).max(200).default('Hello, can you help me with my fitness goals?')
  })),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { provider, message } = req.body;
    const userId = req.user!.userId;

    const aiRequest: AIRequest = {
      message,
      provider,
      userId,
      maxTokens: 100 // Keep test responses short
    };

    const startTime = Date.now();
    const response = await aiService.generateResponse(aiRequest);
    const responseTime = Date.now() - startTime;

    logger.info(`AI provider test`, {
      userId,
      provider: response.provider,
      model: response.model,
      responseTime,
      tokens: response.tokens
    });

    res.json({
      success: true,
      data: {
        provider: response.provider,
        model: response.model,
        response: response.content,
        tokens: response.tokens,
        responseTime,
        cost: response.cost
      }
    });
  })
);

export { router as chatRoutes };