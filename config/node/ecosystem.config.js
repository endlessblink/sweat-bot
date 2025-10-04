/**
 * PM2 Ecosystem Configuration for SweatBot
 * Manages all services with automatic restart, logging, and monitoring
 */

const path = require('path');
const dotenv = require('dotenv');

// Load unified environment configuration
const envPath = path.join(__dirname, '.env.unified');
dotenv.config({ path: envPath });

module.exports = {
  apps: [
    // Backend API Service
    {
      name: 'sweatbot-backend',
      script: '../venv/bin/python',
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload',
      cwd: './backend',
      interpreter: 'none',
      env: {
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        MONGODB_URL: process.env.MONGODB_URL,
        SECRET_KEY: process.env.SECRET_KEY,
        WHISPER_MODEL_SIZE: process.env.WHISPER_MODEL_SIZE,
        LOG_LEVEL: process.env.LOG_LEVEL,
        DEBUG: process.env.DEBUG,
        CORS_ORIGINS: process.env.CORS_ORIGINS
      },
      max_memory_restart: '1G',
      autorestart: true,
      watch: false,
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    },

    // Frontend Vite Service
    {
      name: 'sweatbot-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './personal-ui-vite',
      env: {
        PORT: process.env.FRONTEND_PORT,
        VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
        VITE_AGENT_BASE_URL: process.env.VITE_AGENT_BASE_URL,
        VITE_WS_URL: process.env.VITE_WS_URL,
        NODE_ENV: 'development'
      },
      max_memory_restart: '500M',
      autorestart: true,
      watch: false,
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },

    // AI Agent Service
    {
      name: 'sweatbot-agent',
      script: 'venv/bin/python',
      args: 'agent_service_enhanced.py',
      interpreter: 'none',
      cwd: './',
      env: {
        AGENT_SERVICE_PORT: process.env.AGENT_PORT,
        DATABASE_URL: process.env.DATABASE_URL,
        MONGODB_URL: process.env.MONGODB_URL,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY,
        OLLAMA_HOST: process.env.OLLAMA_HOST,
        LOG_LEVEL: process.env.LOG_LEVEL,
        DEBUG: process.env.DEBUG
      },
      max_memory_restart: '2G',
      autorestart: true,
      watch: false,
      error_file: './logs/agent-error.log',
      out_file: './logs/agent-out.log',
      log_file: './logs/agent-combined.log',
      time: true,
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 30000
    },

    // Health Dashboard Service
    {
      name: 'sweatbot-health',
      script: 'venv/bin/python',
      args: 'health_dashboard.py',
      interpreter: 'none',
      cwd: './',
      env: {
        HEALTH_DASHBOARD_PORT: process.env.HEALTH_DASHBOARD_PORT,
        BACKEND_URL: `http://localhost:${process.env.BACKEND_PORT}`,
        FRONTEND_URL: `http://localhost:${process.env.FRONTEND_PORT}`,
        AGENT_URL: `http://localhost:${process.env.AGENT_PORT}`,
        DATABASE_URL: process.env.DATABASE_URL,
        REDIS_URL: process.env.REDIS_URL,
        MONGODB_URL: process.env.MONGODB_URL,
        LOG_LEVEL: process.env.LOG_LEVEL
      },
      max_memory_restart: '200M',
      autorestart: true,
      watch: false,
      error_file: './logs/health-error.log',
      out_file: './logs/health-out.log',
      log_file: './logs/health-combined.log',
      time: true
    },

    // Ollama Service (optional, only if AI_MODEL_PRIORITY includes ollama)
    {
      name: 'sweatbot-ollama',
      script: 'ollama',
      args: 'serve',
      env: {
        OLLAMA_HOST: '0.0.0.0:11434',
        OLLAMA_MODELS: '/home/endlessblink/.ollama/models'
      },
      max_memory_restart: '4G',
      autorestart: true,
      watch: false,
      error_file: './logs/ollama-error.log',
      out_file: './logs/ollama-out.log',
      log_file: './logs/ollama-combined.log',
      time: true,
      // Only start if ollama is in the model priority
      min_uptime: '10s',
      max_restarts: 3
    }
  ],

  // Deploy configuration for production
  deploy: {
    production: {
      user: 'sweatbot',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/sweatbot.git',
      path: '/var/www/sweatbot',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};