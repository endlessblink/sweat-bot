/**
 * OpenAI Provider for Volt Agent
 * Implements GPT-4o-mini, GPT-5-mini, GPT-5-nano and other OpenAI models with reliable tool calling
 * Updated to support GPT-5 parameters (reasoning_effort, verbosity, max_output_tokens)
 */

import OpenAI from 'openai';

export interface OpenAIProviderConfig {
  apiKey: string;
  model?: string;
  organization?: string;
  baseURL?: string;
}

// Helper to check if model is GPT-5 family
function isGPT5Model(model: string): boolean {
  return model.startsWith('gpt-5');
}

// Map temperature to reasoning_effort for GPT-5 models
function mapTemperatureToReasoningEffort(temperature?: number): "minimal" | "low" | "medium" | "high" {
  if (!temperature) return "medium";
  if (temperature <= 0.3) return "minimal";
  if (temperature <= 0.6) return "low";
  if (temperature <= 0.8) return "medium";
  return "high";
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
      const model = this.config.model || 'gpt-4o-mini';
      const isGPT5 = isGPT5Model(model);

      // For GPT-5 models, use the new Responses API
      if (isGPT5) {
        return await this.chatGPT5(prompt, options);
      }

      // Build messages array with system prompt (for GPT-4 and earlier)
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
        model,
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
          model,
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

  // New method for GPT-5 models using the Responses API
  private async chatGPT5(prompt: string, options?: any) {
    try {
      console.log('Sending to GPT-5:', prompt.substring(0, 100) + '...');
      const model = this.config.model || 'gpt-5-mini';

      // Prepare the request parameters for GPT-5
      const requestParams: any = {
        model,
        input: prompt,
        max_output_tokens: 1024
      };

      // Add reasoning effort based on temperature
      if (options?.temperature !== undefined) {
        requestParams.reasoning = {
          effort: mapTemperatureToReasoningEffort(options.temperature)
        };
      } else {
        requestParams.reasoning = {
          effort: mapTemperatureToReasoningEffort(0.7)
        };
      }

      // Add verbosity control
      requestParams.text = {
        verbosity: 'medium' // Can be customized based on options
      };

      // Add tools if provided
      if (options?.tools && options.tools.length > 0) {
        requestParams.tools = this.formatGPT5Tools(options.tools);
      }

      // Make the API call using the Responses API
      const response = await (this.client as any).responses.create(requestParams);

      // Extract the response
      let content = response.output || response.choices?.[0]?.message?.content || '';

      // Ensure content is a string
      if (typeof content !== 'string') {
        content = String(content);
      }

      console.log('GPT-5 response received, length:', content.length);
      console.log('GPT-5 content preview:', content.substring(0, 100));

      // Check if this response has tool calls
      const toolCalls = response.tool_calls || response.choices?.[0]?.message?.tool_calls ?
        this.extractGPT5ToolCalls(response.tool_calls || response.choices?.[0]?.message?.tool_calls) : [];

      if (toolCalls.length > 0) {
        // Return an object that VoltAgent expects for tool handling
        return {
          content: content || '',
          model,
          toolCalls: toolCalls
        };
      } else {
        // For non-tool responses, return just the content string
        return content || 'שלום! איך אוכל לעזור?';
      }

    } catch (error: any) {
      console.error('GPT-5 API error:', error);
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

      throw new Error(`GPT-5 API failed: ${error.message}`);
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
    return toolCalls
      .filter((call): call is OpenAI.Chat.ChatCompletionMessageToolCall & { type: 'function'; function: NonNullable<OpenAI.Chat.ChatCompletionMessageToolCall["function"]> } => {
        return call.type === 'function' && !!call.function;
      })
      .map((call) => {
        const rawArgs = call.function.arguments;
        let parsedArgs: Record<string, unknown> = {};
        if (typeof rawArgs === 'string' && rawArgs.trim()) {
          try {
            parsedArgs = JSON.parse(rawArgs);
          } catch (parseError) {
            console.warn('Failed to parse OpenAI tool arguments:', parseError);
          }
        } else if (rawArgs && typeof rawArgs === 'object') {
          parsedArgs = rawArgs as Record<string, unknown>;
        }
        
        return {
          name: call.function.name,
          parameters: parsedArgs
        };
      });
  }

  // Format tools for GPT-5 API
  private formatGPT5Tools(tools: any[]): any[] {
    // GPT-5 uses same format as GPT-4 for tools
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        // tool.parameters is already a complete JSON Schema object
        parameters: tool.parameters
      }
    }));
  }

  // Extract tool calls from GPT-5 response
  private extractGPT5ToolCalls(toolCalls: any[]): any[] {
    if (!toolCalls) return [];

    return toolCalls
      .filter((call: any) => call.type === 'function' && !!call.function)
      .map((call: any) => {
        const rawArgs = call.function.arguments;
        let parsedArgs: Record<string, unknown> = {};
        if (typeof rawArgs === 'string' && rawArgs.trim()) {
          try {
            parsedArgs = JSON.parse(rawArgs);
          } catch (parseError) {
            console.warn('Failed to parse GPT-5 tool arguments:', parseError);
          }
        } else if (rawArgs && typeof rawArgs === 'object') {
          parsedArgs = rawArgs as Record<string, unknown>;
        }

        return {
          name: call.function.name,
          parameters: parsedArgs
        };
      });
  }
}
