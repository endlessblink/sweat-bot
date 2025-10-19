import { Pool, PoolClient, QueryResult } from 'pg';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { createClient, RedisClientType } from 'redis';
import { config, postgresConfig, mongoConfig, redisConfig } from '../config/environment';
import { logger } from '../utils/logger';
import { CustomError } from '../middleware/errorHandler';

// Type definitions for database models
export interface User {
  id?: string;
  email: string;
  passwordHash: string;
  name: string;
  age?: number;
  weight?: number;
  height?: number;
  fitnessGoals?: string[];
  preferredLanguage?: 'en' | 'he';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExerciseLog {
  id?: string;
  userId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight?: number;
  notes?: string;
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'sports';
  createdAt?: Date;
}

export interface WorkoutSession {
  id?: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  exercises: ExerciseLog[];
  totalPoints?: number;
  notes?: string;
  completed: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  provider?: string;
  model?: string;
  tokens?: number;
}

export interface Conversation {
  _id?: ObjectId;
  userId: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PointsRecord {
  _id?: ObjectId;
  userId: string;
  points: number;
  reason: string;
  source: string;
  metadata?: any;
  createdAt: Date;
}

export class DatabaseService {
  private static instance: DatabaseService;

  // Database connections
  public postgres: Pool;
  public mongo: Db;
  public redis: RedisClientType;

  // MongoDB collections
  private conversations: Collection<Conversation>;
  private points: Collection<PointsRecord>;
  private workoutSessions: Collection<WorkoutSession>;

  constructor() {
    // PostgreSQL
    this.postgres = new Pool(postgresConfig);

    // MongoDB
    const mongoClient = new MongoClient(config.MONGODB_URL, mongoConfig);
    this.mongo = mongoClient.db('sweatbot');

    // Redis
    this.redis = createClient(redisConfig);

    // Initialize collections
    this.conversations = this.mongo.collection('conversations');
    this.points = this.mongo.collection('points');
    this.workoutSessions = this.mongo.collection('workout_sessions');

    // Setup error handlers
    this.setupErrorHandlers();
  }

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private setupErrorHandlers() {
    // PostgreSQL error handling
    this.postgres.on('error', (err) => {
      logger.error('PostgreSQL pool error:', err);
    });

    // Redis error handling
    this.redis.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    this.redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.redis.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.redis.on('end', () => {
      logger.warn('Redis client disconnected');
    });
  }

  async connect(): Promise<void> {
    try {
      // Test PostgreSQL connection
      const pgClient = await this.postgres.connect();
      await pgClient.query('SELECT 1');
      pgClient.release();
      logger.info('✅ PostgreSQL connected successfully');

      // Test MongoDB connection
      await this.mongo.admin().ping();
      logger.info('✅ MongoDB connected successfully');

      // Test Redis connection
      await this.redis.connect();
      await this.redis.ping();
      logger.info('✅ Redis connected successfully');

      logger.info('🎉 All databases connected successfully!');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      throw new CustomError(`Database connection failed: ${error.message}`, 500);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.postgres.end();
      await this.mongo.close();
      await this.redis.disconnect();
      logger.info('🔌 All databases disconnected successfully');
    } catch (error) {
      logger.error('❌ Error during database disconnection:', error);
    }
  }

  // User Management (PostgreSQL)
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const query = `
        INSERT INTO users (email, password_hash, name, age, weight, height, fitness_goals, preferred_language, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, email, name, age, weight, height, fitness_goals, preferred_language, created_at, updated_at
      `;

      const values = [
        userData.email,
        userData.passwordHash,
        userData.name,
        userData.age || null,
        userData.weight || null,
        userData.height || null,
        userData.fitnessGoals || [],
        userData.preferredLanguage || 'en'
      ];

      const result: QueryResult = await this.postgres.query(query, values);
      return result.rows[0];
    } catch (error: any) {
      logger.error('Error creating user:', error);
      if (error.code === '23505') { // Unique violation
        throw new CustomError('Email already exists', 409);
      }
      throw new CustomError('Failed to create user', 500);
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result: QueryResult = await this.postgres.query(query, [email]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user by email:', error);
      throw new CustomError('Failed to get user', 500);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result: QueryResult = await this.postgres.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting user by ID:', error);
      throw new CustomError('Failed to get user', 500);
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const fields = Object.keys(updates).filter(key => key !== 'id');
      const values = Object.values(updates).filter((_, index) => fields[index] !== 'id');

      if (fields.length === 0) {
        throw new CustomError('No fields to update', 400);
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const query = `
        UPDATE users
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, name, age, weight, height, fitness_goals, preferred_language, created_at, updated_at
      `;

      const result: QueryResult = await this.postgres.query(query, [userId, ...values]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new CustomError('Failed to update user', 500);
    }
  }

  // Exercise Logging (PostgreSQL)
  async logExercise(userId: string, exerciseData: Omit<ExerciseLog, 'id' | 'userId' | 'createdAt'>): Promise<ExerciseLog> {
    try {
      const query = `
        INSERT INTO exercise_logs (user_id, exercise_name, sets, reps, weight, notes, workout_type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const values = [
        userId,
        exerciseData.exerciseName,
        exerciseData.sets,
        exerciseData.reps,
        exerciseData.weight || null,
        exerciseData.notes || null,
        exerciseData.workoutType
      ];

      const result: QueryResult = await this.postgres.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error('Error logging exercise:', error);
      throw new CustomError('Failed to log exercise', 500);
    }
  }

  async getExerciseHistory(userId: string, limit: number = 20, offset: number = 0): Promise<ExerciseLog[]> {
    try {
      const query = `
        SELECT * FROM exercise_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result: QueryResult = await this.postgres.query(query, [userId, limit, offset]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting exercise history:', error);
      throw new CustomError('Failed to get exercise history', 500);
    }
  }

  async getExerciseStats(userId: string, days: number = 30): Promise<any> {
    try {
      const query = `
        SELECT
          COUNT(*) as total_workouts,
          COUNT(DISTINCT DATE(created_at)) as workout_days,
          SUM(sets) as total_sets,
          SUM(reps) as total_reps,
          AVG(weight) FILTER (WHERE weight IS NOT NULL) as avg_weight
        FROM exercise_logs
        WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
      `;
      const result: QueryResult = await this.postgres.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting exercise stats:', error);
      throw new CustomError('Failed to get exercise stats', 500);
    }
  }

  // Conversation Management (MongoDB)
  async saveConversation(userId: string, messages: ConversationMessage[]): Promise<void> {
    try {
      const conversation: Conversation = {
        userId,
        messages,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.conversations.insertOne(conversation);
    } catch (error) {
      logger.error('Error saving conversation:', error);
      throw new CustomError('Failed to save conversation', 500);
    }
  }

  async getConversationHistory(userId: string, limit: number = 50): Promise<ConversationMessage[]> {
    try {
      const conversations = await this.conversations
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      // Flatten messages from all conversations
      return conversations
        .flatMap(conv => conv.messages)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw new CustomError('Failed to get conversation history', 500);
    }
  }

  async getRecentConversations(userId: string, limit: number = 10): Promise<Conversation[]> {
    try {
      return await this.conversations
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      logger.error('Error getting recent conversations:', error);
      throw new CustomError('Failed to get recent conversations', 500);
    }
  }

  // Points System (MongoDB)
  async awardPoints(userId: string, reason: string, source: string, points: number = 10, metadata?: any): Promise<void> {
    try {
      const pointsRecord: PointsRecord = {
        userId,
        points,
        reason,
        source,
        metadata,
        createdAt: new Date()
      };

      await this.points.insertOne(pointsRecord);

      // Also update Redis cache for quick access
      await this.updateUserPointsCache(userId);
    } catch (error) {
      logger.error('Error awarding points:', error);
      throw new CustomError('Failed to award points', 500);
    }
  }

  async getUserPoints(userId: string, days: number = 30): Promise<{ total: number; recent: PointsRecord[] }> {
    try {
      // Get total points from cache first
      const cachedTotal = await this.redis.get(`user:${userId}:points:total`);
      const total = cachedTotal ? parseInt(cachedTotal) : await this.calculateUserPoints(userId);

      // Get recent points from MongoDB
      const recent = await this.points
        .find({ userId, createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return { total, recent };
    } catch (error) {
      logger.error('Error getting user points:', error);
      throw new CustomError('Failed to get user points', 500);
    }
  }

  private async calculateUserPoints(userId: string): Promise<number> {
    try {
      const result = await this.points.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$points' } } }
      ]).toArray();

      return result.length > 0 ? result[0].total : 0;
    } catch (error) {
      logger.error('Error calculating user points:', error);
      return 0;
    }
  }

  private async updateUserPointsCache(userId: string): Promise<void> {
    try {
      const total = await this.calculateUserPoints(userId);
      await this.redis.setEx(`user:${userId}:points:total`, 3600, total.toString());
    } catch (error) {
      logger.error('Error updating user points cache:', error);
    }
  }

  // Caching (Redis)
  async cacheResponse(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.redis.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('Error caching response:', error);
    }
  }

  async getCachedResponse(key: string): Promise<any | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Error getting cached response:', error);
      return null;
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    } catch (error) {
      logger.error('Error invalidating cache:', error);
    }
  }

  // Health checks
  async checkPostgresHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      const client = await this.postgres.connect();
      await client.query('SELECT 1');
      client.release();
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  async checkMongoHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.mongo.admin().ping();
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  async checkRedisHealth(): Promise<{ status: string; responseTime?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      return { status: 'healthy', responseTime: Date.now() - start };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }
}

export default DatabaseService;