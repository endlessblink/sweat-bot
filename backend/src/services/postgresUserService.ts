import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  is_guest: boolean;
  role: 'guest' | 'user' | 'admin';
  age?: number;
  weight?: number;
  height?: number;
  fitness_goals?: string[];
  preferred_language?: 'he' | 'en';
  created_at: Date;
  updated_at: Date;
  last_active: Date;
  total_points?: number;
  workout_streak?: number;
}

export interface Exercise {
  id: string;
  user_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number; // in minutes
  distance?: number; // in meters
  notes?: string;
  workout_type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other';
  created_at: Date;
}

export interface WorkoutStats {
  user_id: string;
  total_workouts: number;
  total_exercises: number;
  total_sets: number;
  total_reps: number;
  total_weight_lifted: number;
  total_duration: number; // in minutes
  workout_types_count: Record<string, number>;
  last_workout_date?: Date;
  current_streak: number;
  points_earned: number;
}

export interface UserStats {
  user_id: string;
  period_days: number;
  total_workouts: number;
  total_exercises: number;
  total_points: number;
  most_common_exercise: string;
  favorite_workout_type: string;
  improvement_rate: number; // percentage change from previous period
}

export class PostgresUserService {
  private pool: Pool | null = null;
  private readonly connectionString: string;

  constructor() {
    // Convert asyncpg URL to regular PostgreSQL URL for pg driver
    const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:8001/hebrew_fitness';
    this.connectionString = dbUrl.replace('postgresql+asyncpg://', 'postgresql://');
  }

  async connect(): Promise<void> {
    try {
      logger.info('Connecting to PostgreSQL...');
      this.pool = new Pool({
        connectionString: this.connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      logger.info('✅ PostgreSQL connected successfully');
      await this.initializeTables();
    } catch (error) {
      logger.error('❌ PostgreSQL connection failed:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
        logger.info('PostgreSQL disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from PostgreSQL:', error);
    }
  }

  private async initializeTables(): Promise<void> {
    const createTablesSQL = `
      -- Drop existing tables to ensure clean schema
      DROP TABLE IF EXISTS user_points CASCADE;
      DROP TABLE IF EXISTS exercises CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      -- Drop the trigger function if it exists
      DROP FUNCTION IF EXISTS update_updated_at_column();

      -- Users table
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        is_guest BOOLEAN DEFAULT true,
        role VARCHAR(20) DEFAULT 'guest',
        age INTEGER,
        weight DECIMAL(5,2),
        height DECIMAL(5,2),
        fitness_goals JSONB,
        preferred_language VARCHAR(2) DEFAULT 'he',
        total_points INTEGER DEFAULT 0,
        workout_streak INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Exercises table
      CREATE TABLE exercises (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exercise_name VARCHAR(255) NOT NULL,
        sets INTEGER NOT NULL,
        reps INTEGER NOT NULL,
        weight DECIMAL(6,2),
        duration INTEGER, -- minutes
        distance INTEGER, -- meters
        notes TEXT,
        workout_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- User points table
      CREATE TABLE user_points (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        points INTEGER NOT NULL,
        reason VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for performance
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_username ON users(username);
      CREATE INDEX idx_exercises_user_id ON exercises(user_id);
      CREATE INDEX idx_exercises_created_at ON exercises(created_at);
      CREATE INDEX idx_user_points_user_id ON user_points(user_id);
      CREATE INDEX idx_user_points_created_at ON user_points(created_at);

      -- Update trigger for updated_at
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    try {
      const client = await this.pool!.connect();
      await client.query(createTablesSQL);
      client.release();
      logger.info('✅ PostgreSQL tables initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize PostgreSQL tables:', error);
      throw error;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_active'>): Promise<User> {
    const client = await this.pool!.connect();
    try {
      const query = `
        INSERT INTO users (
          username, email, full_name, is_guest, role, age, weight, height,
          fitness_goals, preferred_language, total_points, workout_streak
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        userData.username,
        userData.email,
        userData.full_name,
        userData.is_guest,
        userData.role,
        userData.age,
        userData.weight,
        userData.height,
        JSON.stringify(userData.fitness_goals || []),
        userData.preferred_language,
        userData.total_points || 0,
        userData.workout_streak || 0
      ];

      const result = await client.query(query, values);
      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const client = await this.pool!.connect();
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await client.query(query, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await this.pool!.connect();
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await client.query(query, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'created_at'>>): Promise<User | null> {
    const client = await this.pool!.connect();
    try {
      const fields = Object.keys(updates).filter(key => key !== 'created_at');
      if (fields.length === 0) {
        return this.getUserById(userId);
      }

      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
      const values = fields.map(field => {
        const value = updates[field as keyof typeof updates];
        if (field === 'fitness_goals' && Array.isArray(value)) {
          return JSON.stringify(value);
        }
        return value;
      });

      const query = `
        UPDATE users
        SET ${setClause}
        WHERE id = $1
        RETURNING *
      `;

      const result = await client.query(query, [userId, ...values]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateUserLastActive(userId: string): Promise<void> {
    const client = await this.pool!.connect();
    try {
      await client.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [userId]
      );
    } finally {
      client.release();
    }
  }

  async logExercise(exerciseData: Omit<Exercise, 'id' | 'created_at'>): Promise<Exercise> {
    const client = await this.pool!.connect();
    try {
      const query = `
        INSERT INTO exercises (
          user_id, exercise_name, sets, reps, weight, duration, distance,
          notes, workout_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const values = [
        exerciseData.user_id,
        exerciseData.exercise_name,
        exerciseData.sets,
        exerciseData.reps,
        exerciseData.weight,
        exerciseData.duration,
        exerciseData.distance,
        exerciseData.notes,
        exerciseData.workout_type
      ];

      const result = await client.query(query, values);

      // Award points for exercise
      const pointsAwarded = Math.floor(Math.random() * 20) + 10;
      await this.awardPoints(
        exerciseData.user_id,
        pointsAwarded,
        `Completed ${exerciseData.exercise_name} - ${exerciseData.sets} sets × ${exerciseData.reps} reps`,
        'exercise_logging',
        { exercise_name: exerciseData.exercise_name, sets: exerciseData.sets, reps: exerciseData.reps }
      );

      // Update user's total points and streak
      await this.updateUserStats(exerciseData.user_id, pointsAwarded);

      return this.mapRowToExercise(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getExerciseHistory(userId: string, limit: number = 20, offset: number = 0): Promise<Exercise[]> {
    const client = await this.pool!.connect();
    try {
      const query = `
        SELECT * FROM exercises
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await client.query(query, [userId, limit, offset]);
      return result.rows.map(row => this.mapRowToExercise(row));
    } finally {
      client.release();
    }
  }

  async getWorkoutStats(userId: string, days: number = 30): Promise<WorkoutStats> {
    const client = await this.pool!.connect();
    try {
      const query = `
        SELECT
          COUNT(*) as total_workouts,
          COUNT(DISTINCT id) as total_exercises,
          COALESCE(SUM(sets), 0) as total_sets,
          COALESCE(SUM(reps), 0) as total_reps,
          COALESCE(SUM(weight * reps), 0) as total_weight_lifted,
          COALESCE(SUM(duration), 0) as total_duration,
          MAX(created_at) as last_workout_date,
          workout_type
        FROM exercises
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY workout_type
      `;

      const result = await client.query(query, [userId]);

      // Get points for the period
      const pointsQuery = `
        SELECT COALESCE(SUM(points), 0) as points_earned
        FROM user_points
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `;
      const pointsResult = await client.query(pointsQuery, [userId]);

      // Calculate streak (simplified - consecutive days with activity)
      const streakQuery = `
        SELECT COUNT(DISTINCT DATE(created_at)) as active_days
        FROM exercises
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${days} days'
      `;
      const streakResult = await client.query(streakQuery, [userId]);

      const workoutTypesCount: Record<string, number> = {};
      result.rows.forEach(row => {
        workoutTypesCount[row.workout_type] = parseInt(row.total_workouts);
      });

      return {
        user_id: userId,
        total_workouts: result.rows.reduce((sum, row) => sum + parseInt(row.total_workouts), 0),
        total_exercises: result.rows.reduce((sum, row) => sum + parseInt(row.total_exercises), 0),
        total_sets: result.rows.reduce((sum, row) => sum + parseInt(row.total_sets), 0),
        total_reps: result.rows.reduce((sum, row) => sum + parseInt(row.total_reps), 0),
        total_weight_lifted: result.rows.reduce((sum, row) => sum + parseFloat(row.total_weight_lifted), 0),
        total_duration: result.rows.reduce((sum, row) => sum + parseInt(row.total_duration), 0),
        workout_types_count: workoutTypesCount,
        last_workout_date: result.rows.length > 0 ? result.rows[0].last_workout_date : undefined,
        current_streak: parseInt(streakResult.rows[0].active_days),
        points_earned: parseInt(pointsResult.rows[0].points_earned)
      };
    } finally {
      client.release();
    }
  }

  async getUserStats(userId: string, days: number = 30): Promise<UserStats> {
    const currentStats = await this.getWorkoutStats(userId, days);
    const previousStats = await this.getWorkoutStats(userId, days * 2);

    const improvementRate = previousStats.total_workouts > 0
      ? ((currentStats.total_workouts - previousStats.total_workouts) / previousStats.total_workouts) * 100
      : 0;

    // Get most common exercise
    const mostCommonQuery = `
      SELECT exercise_name, COUNT(*) as count
      FROM exercises
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY exercise_name
      ORDER BY count DESC
      LIMIT 1
    `;
    const client = await this.pool!.connect();
    try {
      const result = await client.query(mostCommonQuery, [userId]);

      return {
        user_id: userId,
        period_days: days,
        total_workouts: currentStats.total_workouts,
        total_exercises: currentStats.total_exercises,
        total_points: currentStats.points_earned,
        most_common_exercise: result.rows.length > 0 ? result.rows[0].exercise_name : 'None',
        favorite_workout_type: Object.keys(currentStats.workout_types_count).length > 0
          ? Object.entries(currentStats.workout_types_count)
              .sort(([,a], [,b]) => b - a)[0][0]
          : 'None',
        improvement_rate: Math.round(improvementRate * 100) / 100
      };
    } finally {
      client.release();
    }
  }

  private async awardPoints(
    userId: string,
    points: number,
    reason: string,
    category: string,
    metadata?: any
  ): Promise<void> {
    const client = await this.pool!.connect();
    try {
      await client.query(
        `INSERT INTO user_points (user_id, points, reason, category, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, points, reason, category, JSON.stringify(metadata || {})]
      );
    } finally {
      client.release();
    }
  }

  private async updateUserStats(userId: string, points: number): Promise<void> {
    const client = await this.pool!.connect();
    try {
      await client.query(
        'UPDATE users SET total_points = total_points + $1 WHERE id = $2',
        [points, userId]
      );
    } finally {
      client.release();
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      full_name: row.full_name,
      is_guest: row.is_guest,
      role: row.role,
      age: row.age,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      height: row.height ? parseFloat(row.height) : undefined,
      fitness_goals: row.fitness_goals ? JSON.parse(row.fitness_goals) : [],
      preferred_language: row.preferred_language,
      total_points: row.total_points,
      workout_streak: row.workout_streak,
      created_at: row.created_at,
      updated_at: row.updated_at,
      last_active: row.last_active
    };
  }

  private mapRowToExercise(row: any): Exercise {
    return {
      id: row.id,
      user_id: row.user_id,
      exercise_name: row.exercise_name,
      sets: row.sets,
      reps: row.reps,
      weight: row.weight ? parseFloat(row.weight) : undefined,
      duration: row.duration,
      distance: row.distance,
      notes: row.notes,
      workout_type: row.workout_type,
      created_at: row.created_at
    };
  }

  async healthCheck(): Promise<{
    connected: boolean;
    tables?: string[];
    error?: string;
  }> {
    try {
      if (!this.pool) {
        return { connected: false, error: 'Database not initialized' };
      }

      const client = await this.pool.connect();
      const result = await client.query(`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
      `);
      client.release();

      return {
        connected: true,
        tables: result.rows.map(row => row.tablename)
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
export const postgresUserService = new PostgresUserService();