import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const serverConfig = {
  port: parseInt(process.env.PORT || '8000'),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8005',
    credentials: true
  },

  // Database configuration is in database.ts

  // Local AI Model Configuration
  ollama: {
    host: process.env.OLLAMA_HOST || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'llama2',
    enabled: process.env.ENABLE_LOCAL_AI === 'true'
  },

  // Cloud AI API Configuration
  apis: {
    openai: process.env.OPENAI_API_KEY,
    groq: process.env.GROQ_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  }
};