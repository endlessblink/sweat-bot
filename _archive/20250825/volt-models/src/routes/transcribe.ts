import { Router } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export const transcribeRoute = Router();

transcribeRoute.post('/', async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    // Save audio to temporary file
    const tempDir = '/tmp';
    const tempFile = path.join(tempDir, `audio_${Date.now()}.webm`);
    
    await fs.writeFile(tempFile, req.file.buffer);
    
    // Transcribe with Whisper
    const { stdout } = await execAsync(
      `python3 -c "
import whisper
model = whisper.load_model('large-v3')
result = model.transcribe('${tempFile}', language='he')
print(result['text'])
"`,
      { maxBuffer: 1024 * 1024 * 10 } // 10MB buffer
    );
    
    // Clean up temp file
    await fs.unlink(tempFile).catch(() => {});
    
    res.json({
      text: stdout.trim(),
      language: 'he',
      model: 'whisper-large-v3'
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Fallback response
    res.status(500).json({
      error: 'Transcription failed',
      fallback: true,
      text: 'עשיתי 20 סקוואטים' // Example fallback
    });
  }
});