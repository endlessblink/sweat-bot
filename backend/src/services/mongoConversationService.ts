import { MongoClient, Db, Collection } from 'mongodb';
import { logger } from '../utils/logger';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
  tokens?: number;
  sessionId?: string;
}

export interface Conversation {
  _id?: string;
  userId: string;
  sessionId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    userAgent?: string;
    deviceInfo?: string;
    language?: string;
    title?: string;
  };
}

export class MongoConversationService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private conversations: Collection<Conversation> | null = null;
  private readonly connectionString: string;
  private readonly dbName: string;

  constructor() {
    this.connectionString = process.env.MONGODB_URL || 'mongodb://localhost:8002/sweatbot_conversations';
    this.dbName = 'sweatbot_conversations';
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to MongoDB...');
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.conversations = this.db.collection<Conversation>('conversations');

      // Create indexes for better performance
      await this.conversations.createIndex({ userId: 1, sessionId: 1 });
      await this.conversations.createIndex({ userId: 1, updatedAt: -1 });
      await this.conversations.createIndex({ sessionId: 1 });

      logger.info('✅ MongoDB connected successfully');
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.conversations = null;
        logger.info('MongoDB disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
    }
  }

  async saveMessage(userId: string, sessionId: string, message: Omit<ConversationMessage, 'timestamp'>): Promise<void> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const conversationMessage: ConversationMessage = {
        ...message,
        timestamp: new Date()
      };

      const now = new Date();
      const result = await this.conversations.updateOne(
        { userId, sessionId },
        {
          $set: {
            updatedAt: now
          },
          $push: {
            messages: conversationMessage
          },
          $setOnInsert: {
            userId,
            sessionId,
            createdAt: now,
            metadata: {
              userAgent: message.provider || 'unknown',
              deviceInfo: 'unknown'
            }
          }
        },
        { upsert: true }
      );

      if (result.upsertedCount > 0) {
        logger.info('New conversation created', { userId, sessionId });
      } else {
        logger.debug('Message added to existing conversation', { userId, sessionId });
      }
    } catch (error) {
      logger.error('Failed to save message:', error);
      throw error;
    }
  }

  async getConversationHistory(userId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const conversation = await this.conversations.findOne(
        { userId },
        {
          sort: { updatedAt: -1 },
          projection: { messages: 1 }
        }
      );

      if (!conversation || !conversation.messages) {
        return [];
      }

      // Return last N messages
      return conversation.messages.slice(-limit);
    } catch (error) {
      logger.error('Failed to get conversation history:', error);
      throw error;
    }
  }

  async getConversationBySessionId(sessionId: string): Promise<Conversation | null> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const conversation = await this.conversations.findOne({ sessionId });
      return conversation;
    } catch (error) {
      logger.error('Failed to get conversation by session ID:', error);
      throw error;
    }
  }

  async getRecentConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const conversations = await this.conversations
        .find({ userId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

      return conversations;
    } catch (error) {
      logger.error('Failed to get recent conversations:', error);
      throw error;
    }
  }

  async deleteConversation(userId: string, sessionId: string): Promise<boolean> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const result = await this.conversations.deleteOne({ userId, sessionId });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  async clearUserHistory(userId: string): Promise<number> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const result = await this.conversations.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      logger.error('Failed to clear user history:', error);
      throw error;
    }
  }

  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastActivity: Date | null;
  }> {
    try {
      if (!this.conversations) {
        throw new Error('MongoDB not connected');
      }

      const stats = await this.conversations.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalConversations: { $sum: 1 },
            totalMessages: { $sum: { $size: '$messages' } },
            lastActivity: { $max: '$updatedAt' }
          }
        }
      ]).toArray();

      return {
        totalConversations: stats[0]?.totalConversations || 0,
        totalMessages: stats[0]?.totalMessages || 0,
        lastActivity: stats[0]?.lastActivity || null
      };
    } catch (error) {
      logger.error('Failed to get conversation stats:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    connected: boolean;
    collections?: number;
    indexes?: string[];
    error?: string;
  }> {
    try {
      if (!this.db) {
        return { connected: false, error: 'Database not initialized' };
      }

      const collections = await this.db.listCollections().toArray();
      const indexes = this.conversations ? await this.conversations.indexes().then(idx =>
        idx.map(i => i.name || 'unknown')
      ) : [];

      return {
        connected: true,
        collections: collections.length,
        indexes
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const mongoConversationService = new MongoConversationService();