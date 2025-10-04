/**
 * Groq Provider for Volt Agent
 * Fixed implementation with browser compatibility
 */

import Groq from 'groq-sdk';
import { sanitizeResponse, isResponseSafe } from '../utils/responseSanitizer';

export interface GroqProviderConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

export class GroqProvider {
  private client: Groq;
  private config: GroqProviderConfig;
  
  constructor(config: GroqProviderConfig) {
    this.config = config;
    
    if (!config.apiKey) {
      console.error('Groq API key is missing');
      throw new Error('Groq API key is required');
    }
    
    // CRITICAL FIX: Enable browser usage
    this.client = new Groq({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  }
  
  async chat(prompt: string, options?: any) {
    try {
      console.log('Sending to Groq:', prompt.substring(0, 100) + '...');
      
      // Build messages array with system prompt
      const messages: any[] = [];
      
      // Add system message if provided
      if (options?.systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: options.systemPrompt
        });
      }
      
      // Add user message
      messages.push({
        role: 'user' as const,
        content: prompt
      });
      
      // Make the API call
      const chatCompletion = await this.client.chat.completions.create({
        messages,
        model: this.config.model || 'llama-3.3-70b-versatile',
        temperature: options?.temperature || 0.9,  // Higher default for variety
        max_tokens: 1024,
        top_p: 0.95,
        // Add tools if provided
        tools: options?.tools ? this.formatTools(options.tools) : undefined,
        tool_choice: options?.tools ? 'auto' : undefined
      });
      
      const response = chatCompletion.choices[0];
      let content = response.message.content || '';
      
      console.log('Groq response received, length:', content.length);
      if (content.length <= 2) {
        console.warn('Groq returned very short response:', content, 'Full response:', response);
      }
      
      // CRITICAL FIX: Return format that VoltAgent expects
      // When tools are present, VoltAgent will handle them
      // We should NOT return a complex object that will be stringified
      
      // CRITICAL: Check if content contains function definitions
      if (content && !isResponseSafe(content)) {
        console.warn('Groq returned function definition in content, sanitizing:', content.substring(0, 100));
        content = sanitizeResponse(content, { lastUserMessage: prompt });
      }
      
      // Check if this response has tool calls
      const toolCalls = response.message.tool_calls ? this.extractToolCalls(response.message.tool_calls) : [];
      
      if (toolCalls.length > 0) {
        // Return an object that VoltAgent expects for tool handling
        return {
          content: content || '',  // Often empty for tool calls
          model: this.config.model || 'llama-3.3-70b-versatile',
          toolCalls: toolCalls
        };
      } else {
        // For non-tool responses, return just the content string
        // Make sure it's clean!
        return content || '';
      }
      
    } catch (error) {
      console.error('Groq API error:', error);
      
      // Check for specific error types
      if (error.message?.includes('API key')) {
        throw new Error('Invalid Groq API key');
      }
      if (error.message?.includes('rate limit')) {
        throw new Error('Groq API rate limit exceeded');
      }
      
      throw new Error(`Groq API failed: ${error.message}`);
    }
  }
  
  async *chatStream(prompt: string, options?: any) {
    try {
      // Build messages array with system prompt
      const messages: any[] = [];
      
      if (options?.systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: options.systemPrompt
        });
      }
      
      messages.push({
        role: 'user' as const,
        content: prompt
      });
      
      // Create streaming chat completion
      const stream = await this.client.chat.completions.create({
        messages,
        model: this.config.model || 'llama-3.3-70b-versatile',
        temperature: options?.temperature || 0.7,
        max_tokens: 1024,
        stream: true
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield {
            content,
            done: false
          };
        }
      }
      
      yield { content: '', done: true };
    } catch (error) {
      console.error('Groq stream error:', error);
      throw error;
    }
  }
  
  private formatTools(tools: any[]): any[] {
    // Format tools in OpenAI-compatible format for Groq
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters || {},
          required: tool.required || []
        }
      }
    }));
  }
  
  private extractToolCalls(toolCalls: any[]): any[] {
    // Extract tool calls from Groq response
    return toolCalls.map((call: any) => ({
      name: call.function.name,
      parameters: typeof call.function.arguments === 'string' 
        ? JSON.parse(call.function.arguments) 
        : call.function.arguments || {}
    }));
  }
}