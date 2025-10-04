/**
 * Gemini Provider for Volt Agent
 * Fixed implementation with proper response extraction
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeminiProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

export class GeminiProvider {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: GeminiProviderConfig;
  
  constructor(config: GeminiProviderConfig) {
    this.config = config;
    
    if (!config.apiKey) {
      console.error('Gemini API key is missing');
      throw new Error('Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.model || 'gemini-1.5-pro' 
    });
  }
  
  async chat(prompt: string, options?: any) {
    try {
      console.log('Sending to Gemini:', prompt.substring(0, 100) + '...');
      
      // Build the full prompt with system context if provided
      let fullPrompt = prompt;
      if (options?.systemPrompt) {
        fullPrompt = `${options.systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
      }
      
      // Use generateContent for single requests
      const result = await this.model.generateContent({
        contents: [{ 
          role: 'user', 
          parts: [{ text: fullPrompt }] 
        }],
        generationConfig: {
          temperature: options?.temperature || 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        // Add tools if provided
        tools: options?.tools ? this.formatTools(options.tools) : undefined
      });
      
      const response = await result.response;
      
      // CRITICAL FIX: Properly extract text from response - MUST BE ASYNC!
      const text = await response.text();
      
      console.log('Gemini response received, length:', text.length);
      
      // Return in consistent format
      return {
        content: text,
        model: this.config.model || 'gemini-1.5-pro',
        toolCalls: this.extractToolCalls(response)
      };
      
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Check for specific error types
      if (error.message?.includes('API key')) {
        throw new Error('Invalid Gemini API key');
      }
      if (error.message?.includes('quota')) {
        throw new Error('Gemini API quota exceeded');
      }
      
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }
  
  async *chatStream(prompt: string, options?: any) {
    try {
      // Build the full prompt with system context if provided
      let fullPrompt = prompt;
      if (options?.systemPrompt) {
        fullPrompt = `${options.systemPrompt}\n\nUser: ${prompt}\nAssistant:`;
      }
      
      const result = await this.model.generateContentStream({
        contents: [{ 
          role: 'user', 
          parts: [{ text: fullPrompt }] 
        }],
        generationConfig: {
          temperature: options?.temperature || 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });
      
      for await (const chunk of result.stream) {
        const text = await chunk.text();
        yield {
          content: text,
          done: false
        };
      }
      
      yield { content: '', done: true };
    } catch (error) {
      console.error('Gemini stream error:', error);
      throw error;
    }
  }
  
  private formatTools(tools: any[]): any[] {
    // Format tools for Gemini function calling
    return [{
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters || {},
          required: tool.required || []
        }
      }))
    }];
  }
  
  private extractToolCalls(response: any): any[] {
    // Extract function calls from Gemini response if present
    try {
      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        const functionCalls = candidate.content?.parts?.filter(
          (part: any) => part.functionCall
        ) || [];
        
        if (functionCalls.length > 0) {
          return functionCalls.map((call: any) => ({
            name: call.functionCall.name,
            parameters: call.functionCall.args || {}
          }));
        }
      }
    } catch (error) {
      console.warn('Error extracting tool calls:', error);
    }
    
    return [];
  }
}