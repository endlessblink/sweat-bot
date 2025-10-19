import express from 'express';
import { logger } from '../../utils/logger';
import { mongoConversationService } from '../../services/mongoConversationService';

const router = express.Router();

// Get conversation history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Get real conversation history from MongoDB
    const conversations = await mongoConversationService.getRecentConversations(userId, limit);

    // Transform conversations to match expected format
    const transformedConversations = conversations.map(conv => ({
      id: conv._id || `conv_${Date.now()}`,
      userId: conv.userId,
      sessionId: conv.sessionId,
      messages: conv.messages || [],
      summary: conv.messages && conv.messages.length > 0
        ? `${conv.messages.length} messages starting with "${conv.messages[0]?.content?.substring(0, 50) || ''}..."`
        : 'Empty conversation',
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages?.length || 0,
      totalTokens: conv.messages?.reduce((sum, msg) => sum + (msg.tokens || 0), 0) || 0,
      tags: conv.metadata ? Object.values(conv.metadata).filter(v => typeof v === 'string') : [],
      metadata: conv.metadata || {}
    }));

    res.json({
      success: true,
      data: {
        conversations: transformedConversations,
        total: transformedConversations.length,
        userId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error fetching conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation history'
    });
  }
});

// Get specific conversation by ID
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Mock specific conversation
    const conversation = {
      id: conversationId,
      userId: 'user_123',
      sessionId: 'session_123',
      messages: [
        {
          id: 'msg_001',
          role: 'user',
          content: 'הי, אני רוצה להתחיל לעבוד בריאות. מה אתה ממליץ?',
          timestamp: '2025-10-19T08:30:00Z',
          language: 'he'
        },
        {
          id: 'msg_002',
          role: 'assistant',
          content: 'ברוכים הבאים! בשמחה אעזור לך להתחיל. מה הניסיון שלך באימונים ומה המטרות שלך?',
          timestamp: '2025-10-19T08:30:15Z',
          language: 'he',
          aiProvider: 'openai',
          model: 'gpt-4o-mini',
          tokens: 45
        },
        {
          id: 'msg_003',
          role: 'user',
          content: 'אני מתחיל, אין לי כמעט ניסיון. אני רוצה ללרדת במשקל ולהיות יותר חזק.',
          timestamp: '2025-10-19T08:31:00Z',
          language: 'he'
        },
        {
          id: 'msg_004',
          role: 'assistant',
          content: 'מצוין! כמתחיל, חשוב להתחיל לאט ולבנות הרגלים. ממליץ להתחיל עם 3 אימונים בשבוע, 20-30 דקות כל אימון. להלן תוכנית למתחילים...',
          timestamp: '2025-10-19T08:31:25Z',
          language: 'he',
          aiProvider: 'openai',
          model: 'gpt-4o-mini',
          tokens: 178
        }
      ],
      summary: 'Initial fitness consultation for a beginner in Hebrew',
      createdAt: '2025-10-19T08:30:00Z',
      updatedAt: '2025-10-19T08:35:22Z',
      messageCount: 8,
      totalTokens: 234,
      tags: ['fitness_planning', 'beginner', 'hebrew', 'weight_loss'],
      metadata: {
        sessionDuration: 322, // seconds
        userSatisfaction: 5, // 1-5 scale
        followUpNeeded: false
      }
    };

    res.json({
      success: true,
      data: conversation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// Create new conversation
router.post('/', async (req, res) => {
  try {
    const { userId, sessionId, initialMessage, language = 'en' } = req.body;

    const newConversation = {
      id: `conv_${Date.now()}`,
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      messages: [
        {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: initialMessage,
          timestamp: new Date().toISOString(),
          language
        }
      ],
      summary: 'New conversation started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 1,
      totalTokens: 0,
      tags: []
    };

    res.status(201).json({
      success: true,
      data: newConversation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation'
    });
  }
});

// Delete conversation by session ID
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;

    if (!userId || !sessionId) {
      res.status(400).json({
        success: false,
        error: 'userId and sessionId are required'
      });
      return;
    }

    // Delete conversation from MongoDB
    const deleted = await mongoConversationService.deleteConversation(userId, sessionId);

    if (deleted) {
      logger.info(`Conversation deleted for user ${userId}, session ${sessionId}`);
      res.json({
        success: true,
        message: 'Conversation deleted successfully',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
  } catch (error) {
    logger.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

// Clear all user conversations
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        error: 'userId is required'
      });
      return;
    }

    // Clear all user history from MongoDB
    const deletedCount = await mongoConversationService.clearUserHistory(userId);

    logger.info(`Cleared ${deletedCount} conversations for user ${userId}`);

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} conversation(s)`,
      deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error clearing user conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversations'
    });
  }
});

export { router as conversationsRouter };