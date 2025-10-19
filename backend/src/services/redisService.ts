import Redis from 'ioredis';
import { logger } from '../utils/logger';

export interface SessionData {
  userId: string;
  sessionId: string;
  deviceInfo?: string;
  userAgent?: string;
  createdAt: Date;
  lastActive: Date;
  username?: string;
  email?: string;
  is_guest: boolean;
  role: string;
}

export interface CacheItem {
  data: any;
  expiry?: number;
  timestamp: number;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
  blocked: boolean;
}

export class RedisService {
  private client: Redis | null = null;
  private readonly connectionString: string;
  private readonly defaultTTL: number = 3600; // 1 hour
  private readonly sessionTTL: number = 86400; // 24 hours

  constructor() {
    this.connectionString = process.env.REDIS_URL || 'redis://localhost:8003';
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to Redis...');

      this.client = new Redis(this.connectionString, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      // Test connection
      await this.client.ping();

      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
        logger.info('Redis disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
    }
  }

  // Session Management Methods
  async createSession(sessionData: SessionData): Promise<void> {
    if (!this.client) {
      throw new Error('Redis not connected');
    }

    try {
      const key = `session:${sessionData.sessionId}`;
      const data = {
        ...sessionData,
        createdAt: sessionData.createdAt.toISOString(),
        lastActive: sessionData.lastActive.toISOString()
      };

      await this.client.setex(
        key,
        this.sessionTTL,
        JSON.stringify(data)
      );

      // Also store in user session index
      const userSessionsKey = `user_sessions:${sessionData.userId}`;
      await this.client.sadd(userSessionsKey, sessionData.sessionId);
      await this.client.expire(userSessionsKey, this.sessionTTL);

      logger.info('Session created in Redis', {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId
      });
    } catch (error) {
      logger.error('Failed to create session in Redis:', error);
      throw error;
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!this.client) {
      return null;
    }

    try {
      const data = await this.client.get(`session:${sessionId}`);
      if (!data) {
        return null;
      }

      const session = JSON.parse(data);
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        lastActive: new Date(session.lastActive)
      };
    } catch (error) {
      logger.error('Failed to get session from Redis:', error);
      return null;
    }
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const data = await this.client.get(`session:${sessionId}`);
      if (!data) {
        return;
      }

      const session = JSON.parse(data);
      session.lastActive = new Date().toISOString();

      await this.client.setex(
        `session:${sessionId}`,
        this.sessionTTL,
        JSON.stringify(session)
      );

      logger.debug('Session activity updated', { sessionId });
    } catch (error) {
      logger.error('Failed to update session activity:', error);
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const data = await this.client.get(`session:${sessionId}`);
      if (data) {
        const session = JSON.parse(data);

        // Remove from user session index
        const userSessionsKey = `user_sessions:${session.userId}`;
        await this.client.srem(userSessionsKey, sessionId);
      }

      await this.client.del(`session:${sessionId}`);

      logger.info('Session deleted from Redis', { sessionId });
    } catch (error) {
      logger.error('Failed to delete session from Redis:', error);
    }
  }

  async getUserSessions(userId: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const sessions = await this.client.smembers(`user_sessions:${userId}`);
      return sessions;
    } catch (error) {
      logger.error('Failed to get user sessions from Redis:', error);
      return [];
    }
  }

  // Caching Methods
  async setCache(key: string, data: any, ttl?: number): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const cacheItem: CacheItem = {
        data,
        expiry: ttl || this.defaultTTL,
        timestamp: Date.now()
      };

      await this.client.setex(
        key,
        cacheItem.expiry,
        JSON.stringify(cacheItem)
      );

      logger.debug('Cache item set', { key, ttl: cacheItem.expiry });
    } catch (error) {
      logger.error('Failed to set cache:', error);
    }
  }

  async getCache(key: string): Promise<any | null> {
    if (!this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (!data) {
        return null;
      }

      const cacheItem: CacheItem = JSON.parse(data);

      // Check if item has expired
      if (cacheItem.expiry && Date.now() - cacheItem.timestamp > cacheItem.expiry * 1000) {
        await this.client.del(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      logger.error('Failed to get cache:', error);
      return null;
    }
  }

  async deleteCache(key: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.del(key);
      logger.debug('Cache item deleted', { key });
    } catch (error) {
      logger.error('Failed to delete cache:', error);
    }
  }

  async clearCachePattern(pattern: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info('Cache pattern cleared', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Failed to clear cache pattern:', error);
    }
  }

  // Rate Limiting Methods
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number = 60000 // 1 minute default
  ): Promise<RateLimitInfo> {
    if (!this.client) {
      return {
        count: 0,
        resetTime: Date.now() + windowMs,
        blocked: false
      };
    }

    try {
      const key = `rate_limit:${identifier}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Clean old entries
      await this.client.zremrangebyscore(key, 0, windowStart - 1);

      // Count current requests in window
      const currentCount = await this.client.zcard(key);

      if (currentCount >= limit) {
        // Get oldest request time for reset calculation
        const oldestRequest = await this.client.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestRequest.length > 0
          ? Math.ceil(parseFloat(oldestRequest[0][1]) + windowMs)
          : now + windowMs;

        return {
          count: currentCount,
          resetTime,
          blocked: true
        };
      }

      // Add current request
      await this.client.zadd(key, now.toString(), `${now}-${Math.random()}`);
      await this.client.expire(key, Math.ceil(windowMs / 1000) + 1);

      return {
        count: currentCount + 1,
        resetTime: now + windowMs,
        blocked: false
      };
    } catch (error) {
      logger.error('Failed to check rate limit:', error);
      return {
        count: 0,
        resetTime: Date.now() + windowMs,
        blocked: false
      };
    }
  }

  // Health Check
  async healthCheck(): Promise<{
    connected: boolean;
    error?: string;
    info?: {
      version: string;
      memory?: string;
      keys?: number;
    };
  }> {
    try {
      if (!this.client) {
        return { connected: false, error: 'Redis not initialized' };
      }

      const info = await this.client.info('server');
      const dbSize = await this.client.dbsize();

      return {
        connected: true,
        info: {
          version: info.split('\r\n')[0]?.split(':')[1]?.trim() || 'unknown',
          memory: info.split('\r\n').find(line => line.includes('used_memory_human'))?.split(':')[1]?.trim(),
          keys: dbSize
        }
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Utility Methods
  async incrementCounter(key: string, amount: number = 1): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      logger.error('Failed to increment counter:', error);
      return 0;
    }
  }

  async setExpiration(key: string, ttlSeconds: number): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.expire(key, ttlSeconds);
    } catch (error) {
      logger.error('Failed to set expiration:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Failed to check key existence:', error);
      return false;
    }
  }
}

// Export singleton instance
export const redisService = new RedisService();