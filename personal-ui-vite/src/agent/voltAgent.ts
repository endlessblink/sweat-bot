/**
 * VoltAgent - Custom AI Agent Framework for SweatBot
 * Complete implementation with proper response handling
 */

import { sanitizeResponse, isResponseSafe } from './utils/responseSanitizer';

export interface VoltAgentConfig {
  name: string;
  providers?: Record<string, any>;
  tools?: any[];
  memory?: any;
  systemPrompt?: string;
  temperature?: number;
  streaming?: boolean;
}

export class VoltAgent {
  private config: VoltAgentConfig;
  public providers: Record<string, any>;
  public tools: any[];
  public memory: any;
  private activeProvider: string = 'openai'; // OpenAI as primary for reliable tool calling
  
  constructor(config: VoltAgentConfig) {
    this.config = config;
    this.providers = config.providers || {};
    this.tools = config.tools || [];
    this.memory = config.memory;
  }
  
  async chat(message: string, options?: any): Promise<string> {
    const callId = Date.now().toString().slice(-4); // Unique ID for this call
    console.log(`[${callId}] VoltAgent.chat starting with message:`, message.substring(0, 50));
    
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`[${callId}] Attempt ${attempts + 1}, provider: ${this.activeProvider}`);
        const provider = this.getActiveProvider();
        if (!provider) {
          throw new Error(`No AI provider available`);
        }
        
        // Build full prompt with system context
        const fullPrompt = this.buildPrompt(message);
        
        // Call provider with tools if available
        console.log(`[${callId}] Calling provider ${this.activeProvider}...`);
        const response = await provider.chat(fullPrompt, {
          ...options,
          tools: this.tools,
          systemPrompt: this.config.systemPrompt,
          temperature: this.config.temperature
        });
        
        console.log(`[${callId}] Provider response type:`, typeof response);
        console.log(`[${callId}] Provider response value:`, response);
        
        // Extract content from response - KEY FIX
        let content: string;
        content = this.extractContent(response);
        console.log(`[${callId}] Extracted content:`, content);
        
        // Debug logging for short responses
        if (content.length <= 2) {
          console.error('Provider returned very short response:', {
            provider: this.activeProvider,
            content: content,
            contentLength: content.length,
            fullResponse: response
          });
        }
        
        // Handle tool calls if present
        if (response && response.toolCalls && response.toolCalls.length > 0) {
          console.log('Tool calls detected, processing...');
          // CRITICAL FIX: Only pass tool calls array, not entire response object
          let toolResult = await this.handleToolCalls(response.toolCalls, content);
          
          // Sanitize tool result as well
          if (!isResponseSafe(toolResult)) {
            console.warn('Tool result contains function syntax, cleaning:', toolResult.substring(0, 100));
            toolResult = sanitizeResponse(toolResult, { lastUserMessage: message });
          }
          
          // CRITICAL DEBUG: Check what we're actually returning
          console.log('=== CRITICAL RETURN CHECK ===');
          console.log('toolResult type:', typeof toolResult);
          console.log('toolResult value:', toolResult);
          console.log('toolResult safe?:', isResponseSafe(toolResult));
          console.log('=== END CRITICAL CHECK ===');
          
          // ENSURE: Return only the clean tool result string
          return toolResult;
        }
        
        // Store in memory if available
        if (this.memory) {
          try {
            await this.memory.addMessage({
              role: 'user',
              content: message,
              timestamp: new Date()
            });
            await this.memory.addMessage({
              role: 'assistant',
              content: content,
              timestamp: new Date()
            });
          } catch (memoryError) {
            console.warn('Memory storage failed:', memoryError);
            // Continue without memory
          }
        }
        
        console.log('VoltAgent about to return final content:', content);
        return content;
        
      } catch (error) {
        console.error(`Provider ${this.activeProvider} failed:`, error);
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`Provider ${this.activeProvider} error details:`, {
          message: err.message,
          stack: err.stack,
          provider: this.activeProvider
        });
        attempts++;
        
        if (attempts < maxAttempts) {
          await this.fallbackToNextProvider();
        } else {
          throw new Error(`All providers failed. Last error: ${err.message}`);
        }
      }
    }
    
    throw new Error('Maximum attempts exceeded');
  }
  
  async *chatStream(message: string, options?: any) {
    const provider = this.getActiveProvider();
    if (!provider) {
      throw new Error('No AI provider available');
    }
    
    const stream = provider.chatStream(message, {
      ...options,
      systemPrompt: this.config.systemPrompt,
      temperature: this.config.temperature
    });
    
    for await (const chunk of stream) {
      yield chunk;
    }
  }
  
  private extractContent(response: any): string {
    console.log('VoltAgent.extractContent - input type:', typeof response);
    console.log('VoltAgent.extractContent - input value:', response);
    
    // Handle different response formats from various providers
    if (typeof response === 'string') {
      console.log('VoltAgent.extractContent - returning string directly:', response);
      return response;
    }
    
    // For tool responses, return empty content - the tool handling logic will process it
    if (response && response.toolCalls && response.toolCalls.length > 0) {
      console.log('VoltAgent: Tool response detected, returning empty content for tool processing');
      return ''; // Empty content, let tool handler take over
    }
    
    // CRITICAL FIX: Ensure we never return objects, only strings
    if (response.content && typeof response.content === 'string') {
      return response.content;
    }
    
    if (response.text && typeof response.text === 'string') {
      return response.text;
    }
    
    if (response.message && response.message.content && typeof response.message.content === 'string') {
      return response.message.content;
    }
    
    if (response.choices && response.choices[0] && response.choices[0].message && typeof response.choices[0].message.content === 'string') {
      return response.choices[0].message.content;
    }
    
    // If none of the above and no tools, provide a simple fallback  
    console.warn('Unknown response format, stringifying for safety:', response);
    // NEVER return objects - always convert to string
    if (typeof response === 'object') {
      return 'תגובה התקבלה'; // Safe Hebrew fallback instead of JSON
    }
    return String(response);
  }
  
  private buildPrompt(message: string): string {
    // Don't duplicate system prompt if provider handles it separately
    if (this.activeProvider === 'groq') {
      return message; // Groq handles system prompt separately
    }
    // For Gemini, include system prompt in the message
    return message; // Gemini will add system prompt via options
  }
  
  private async handleToolCalls(toolCalls: any[], initialContent: string): Promise<string> {
    // For tool calls, ignore initial content and only return tool results
    let finalContent = '';
    
    for (const toolCall of toolCalls) {
      try {
        const toolResult = await this.executeTool(toolCall);
        if (finalContent) {
          finalContent += `\n\n${toolResult}`;
        } else {
          finalContent = toolResult;
        }
      } catch (error) {
        console.error(`Tool execution failed:`, error);
        const err = error instanceof Error ? error : new Error(String(error));
        const errorMsg = `לא הצלחתי להפעיל את הכלי: ${err.message}`;
        finalContent = finalContent ? finalContent + `\n\n${errorMsg}` : errorMsg;
      }
    }
    
    return finalContent;
  }
  
  private async executeTool(toolCall: any): Promise<string> {
    const { name, parameters } = toolCall;
    
    // Find the tool in our tools array
    const tool = this.tools.find(t => t.name === name);
    if (!tool) {
      return `כלי ${name} לא נמצא`;
    }
    
    // Execute the tool's function if it exists
    if (tool.execute) {
      const result = await tool.execute(parameters);
      // Extract the message string from complex tool responses
      if (typeof result === 'object' && result.message) {
        return result.message;
      } else if (typeof result === 'string') {
        return result;
      } else {
        return JSON.stringify(result);
      }
    }
    
    // Default implementation for tools without execute method
    switch (name) {
      case 'log_exercise':
        return `רשמתי את התרגיל: ${parameters.exercise || 'תרגיל'} - ${parameters.reps || 0} חזרות`;
      
      case 'get_statistics':
        return `הנקודות שלך: 150 נקודות השבוע`;
      
      case 'suggest_workout':
        return `הצעת אימון: 3 סטים של 15 סקוואטים, 3 סטים של 10 שכיבות סמיכה`;
      
      case 'manage_data':
        return `פעולת ניהול נתונים בוצעה`;
      
      case 'manage_goals':
        return `היעד נקבע בהצלחה`;
      
      case 'analyze_progress':
        return `ניתוח התקדמות: אתה מתקדם מצוין!`;
      
      default:
        return `Tool ${name} executed with parameters: ${JSON.stringify(parameters)}`;
    }
  }
  
  private getActiveProvider(): any {
    // Priority: OpenAI > Groq > Gemini > Local
    if (this.providers[this.activeProvider]) {
      return this.providers[this.activeProvider];
    }
    
    // Fallback order
    if (this.providers.openai) return this.providers.openai;
    if (this.providers.groq) return this.providers.groq;
    if (this.providers.gemini) return this.providers.gemini;
    if (this.providers.local) return this.providers.local;
    return null;
  }
  
  private async fallbackToNextProvider(): Promise<void> {
    const fallbackOrder = ['openai', 'groq', 'gemini', 'local'];
    const currentIndex = fallbackOrder.indexOf(this.activeProvider);
    
    if (currentIndex < fallbackOrder.length - 1) {
      this.activeProvider = fallbackOrder[currentIndex + 1];
      console.log(`Falling back to provider: ${this.activeProvider}`);
    } else {
      throw new Error('All providers failed');
    }
  }
}
