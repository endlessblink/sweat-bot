import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://:sweatbot_redis_pass@localhost:8003/0';

  try {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('✅ Redis connected successfully');
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis not initialized. Call connectRedis() first');
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.log('✅ Redis disconnected');
  }
}
