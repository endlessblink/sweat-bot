import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { User } from '../entities/User';
import { Workout } from '../entities/Workout';
import { Exercise } from '../entities/Exercise';
import { PersonalRecord } from '../entities/PersonalRecord';
import { Achievement } from '../entities/Achievement';
import { GamificationStats } from '../entities/GamificationStats';
import { Goal } from '../entities/Goal';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '8001'),
  username: process.env.DB_USERNAME || 'fitness_user',
  password: process.env.DB_PASSWORD || 'secure_password',
  database: process.env.DB_DATABASE || 'hebrew_fitness',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  // Use snake_case naming to match Python backend database schema
  namingStrategy: new SnakeNamingStrategy(),
  entities: [
    User,
    Workout,
    Exercise,
    PersonalRecord,
    Achievement,
    GamificationStats,
    Goal
  ],
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
});