/**
 * Volt Models Service
 * Provides local AI model capabilities (Whisper, Ollama) for SweatBot
 */

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { transcribeRoute } from './routes/transcribe';
import { chatRoute } from './routes/chat';
import { healthRoute } from './routes/health';

const app = express();
const PORT = process.env.PORT || 8006;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8000',
    'http://localhost:8001',
    'http://localhost:8002',
    'http://localhost:8003',
    'http://localhost:8004',
    'http://localhost:8005',
    'http://localhost:8006',
    'http://localhost:8007',
    'http://localhost:8008',
    'http://localhost:8009',
    'http://localhost:8010',
    'http://localhost:8011',
    'http://localhost:8012',
    'http://localhost:8013',
    'http://localhost:8014',
    'http://localhost:8015',
    'http://localhost:8016',
    'http://localhost:8017',
    'http://localhost:8018',
    'http://localhost:8019',
    'http://localhost:8020'
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
app.use('/health', healthRoute);
app.use('/transcribe', upload.single('audio'), transcribeRoute);
app.use('/chat', chatRoute);

// Models endpoint
app.get('/models', (req, res) => {
  res.json({
    models: [
      'whisper-large-v3',
      'bjoernb/gemma3n-e2b:latest'
    ]
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Volt Models Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎤 Transcription: POST http://localhost:${PORT}/transcribe`);
  console.log(`💬 Local chat: POST http://localhost:${PORT}/chat/local`);
});