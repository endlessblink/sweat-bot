/**
 * OpenAI Provider for Volt Agent
 * Implements GPT-4o-mini and other OpenAI models with reliable tool calling
 */

import OpenAI from 'openai';

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  organization?: string;
  baseURL?: string;
}

export class OpenAIProvider {
  private client: OpenAI;
  private config: OpenAIProviderConfig;
  
  constructor(config: OpenAIProviderConfig) {
    this.config = config;
    
    if (!config.apiKey) {
      console.error('OpenAI API key is missing');
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      organization: config.organization,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  }
  
  async chat(prompt: string, options?: any) {
    try {
      console.log('Sending to OpenAI:', prompt.substring(0, 100) + '...');
      
      // Build messages array with system prompt
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      // Add system message if provided
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      // Add user message
      messages.push({
        role: 'user',
        content: prompt
      });
      
      // Prepare the request parameters
      const requestParams: OpenAI.Chat.ChatCompletionCreateParams = {
        model: this.config.model || 'gpt-4o-mini',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: 1024
      };
      
      // Add tools if provided
      if (options?.tools && options.tools.length > 0) {
        requestParams.tools = this.formatTools(options.tools);
        requestParams.tool_choice = 'auto'; // Let the model decide when to use tools
      }
      
      // Make the API call
      const response = await this.client.chat.completions.create(requestParams);
      
      // Extract the response
      const message = response.choices[0]?.message;
      if (!message) {
        throw new Error('No response from OpenAI');
      }
      
      const content = message.content || '';
      console.log('OpenAI response received, length:', content.length);
      console.log('OpenAI content preview:', content.substring(0, 100));
      
      // Check if this response has tool calls
      const toolCalls = message.tool_calls ? this.extractToolCalls(message.tool_calls) : [];
      
      if (toolCalls.length > 0) {
        // Return an object that VoltAgent expects for tool handling
        return {
          content: content || '',  
          model: this.config.model || 'gpt-4o-mini',
          toolCalls: toolCalls
        };
      } else {
        // For non-tool responses, return just the content string
        return content || 'שלום! איך אוכל לעזור?';
      }
      
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
        type: error.type,
        stack: error.stack
      });
      
      // Check for specific error types
      if (error.message?.includes('API key') || error.message?.includes('Incorrect API key')) {
        throw new Error('Invalid OpenAI API key');
      }
      if (error.message?.includes('rate limit')) {
        throw new Error('OpenAI API rate limit exceeded');
      }
      if (error.message?.includes('quota')) {
        throw new Error('OpenAI API quota exceeded');
      }
      if (error.status === 401) {
        throw new Error('OpenAI authentication failed - check API key');
      }
      
      throw new Error(`OpenAI API failed: ${error.message}`);
    }
  }
  
  async *chatStream(prompt: string, options?: any) {
    try {
      // Build messages array with system prompt
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (options?.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }
      
      messages.push({
        role: 'user',
        content: prompt
      });
      
      // Create streaming chat completion
      const stream = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-4o-mini',
        messages,
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
      console.error('OpenAI stream error:', error);
      throw error;
    }
  }
  
  private formatTools(tools: any[]): OpenAI.Chat.ChatCompletionTool[] {
    // Format tools in OpenAI format
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters?.type === 'object' ? {
          // If tool.parameters is already a schema object with {type, properties, required}
          type: 'object' as const,
          properties: tool.parameters.properties || {},
          required: tool.parameters.required || []
        } : {
          // Otherwise treat tool.parameters as the properties object directly
          type: 'object' as const,
          properties: tool.parameters || {},
          required: tool.required || []
        }
      }
    }));
  }
  
  private extractToolCalls(toolCalls: OpenAI.Chat.ChatCompletionMessageToolCall[]): any[] {
    // Extract tool calls from OpenAI response
    return toolCalls.map((call) => ({
      name: call.function.name,
      parameters: typeof call.function.arguments === 'string' 
        ? JSON.parse(call.function.arguments) 
        : call.function.arguments || {}
    }));
  }
}