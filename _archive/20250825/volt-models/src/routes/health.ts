import { Router } from 'express';

export const healthRoute = Router();

healthRoute.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'volt-models',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    models: {
      whisper: await checkWhisper(),
      ollama: await checkOllama()
    }
  };
  
  res.json(health);
});

async function checkWhisper(): Promise<boolean> {
  try {
    // Check if Whisper Python module is available
    const { exec } = require('child_process');
    return new Promise((resolve) => {
      exec('python3 -c "import whisper"', (error: any) => {
        resolve(!error);
      });
    });
  } catch {
    return false;
  }
}

async function checkOllama(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return response.ok;
  } catch {
    return false;
  }
}