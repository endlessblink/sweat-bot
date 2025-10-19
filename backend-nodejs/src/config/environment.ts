import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('8000'),

  // Database URLs
  DATABASE_URL: z.string(),
  MONGODB_URL: z.string(),
  REDIS_URL: z.string(),

  // Authentication
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // AI Provider API Keys
  OPENAI_API_KEY: z.string(),
  GROQ_API_KEY: z.string(),
  GEMINI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),

  // CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:8005,http://localhost:3000'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // WebSocket
  SOCKET_CORS_ORIGIN: z.string().default('http://localhost:8005'),
});

export const config = envSchema.parse(process.env);

// CORS configuration
export const corsConfig = {
  origin: config.NODE_ENV === 'production'
    ? ['https://sweat-bot.onrender.com']
    : config.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

// Database connection options
export const postgresConfig = {
  connectionString: config.DATABASE_URL,
  ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const mongoConfig = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

export const redisConfig = {
  url: config.REDIS_URL,
  socket: {
    connectTimeout: 5000,
    lazyConnect: true,
  },
  retry: 3,
};

export default config;