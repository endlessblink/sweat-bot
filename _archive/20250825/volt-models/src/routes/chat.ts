import { Router } from 'express';

export const chatRoute = Router();

// Chat with local Ollama model
chatRoute.post('/local', async (req, res) => {
  try {
    const { prompt, model = 'bjoernb/gemma3n-e2b:latest', temperature = 0.3, maxTokens = 2048 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Call Ollama API
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: maxTokens
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    res.json({
      response: result.response,
      model: result.model || model,
      usage: {
        prompt_tokens: result.prompt_eval_count,
        completion_tokens: result.eval_count,
        total_tokens: (result.prompt_eval_count || 0) + (result.eval_count || 0)
      }
    });
  } catch (error: any) {
    console.error('Local chat error:', error);
    res.status(500).json({
      error: 'Local chat failed',
      message: error.message
    });
  }
});

// Stream chat with local model
chatRoute.post('/local/stream', async (req, res) => {
  try {
    const { prompt, model = 'bjoernb/gemma3n-e2b:latest', temperature = 0.3 } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Call Ollama API with streaming
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature
        }
      })
    });
    
    if (!response.ok || !response.body) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }
    
    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        res.write('data: {"done": true}\n\n');
        res.end();
        break;
      }
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            res.write(`data: ${JSON.stringify({ content: data.response || '' })}\n\n`);
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});