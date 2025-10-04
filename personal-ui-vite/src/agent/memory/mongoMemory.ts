/**
 * MongoDB Memory Adapter for Volt Agent
 * Stores conversation history through backend API
 */

export interface MongoMemoryConfig {
  userId: string;
  backendUrl?: string;
  maxMessages?: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export class MongoMemory {
  private userId: string;
  private backendUrl: string;
  private maxMessages: number;
  private cache: Message[] = [];
  
  constructor(config: MongoMemoryConfig) {
    this.userId = config.userId;
    this.backendUrl = config.backendUrl || 'http://localhost:8000/api/memory';
    this.maxMessages = config.maxMessages || 20;
    
    // Load initial context
    this.loadContext();
  }
  
  /**
   * Load conversation context from MongoDB
   */
  async loadContext(): Promise<void> {
    try {
      const response = await fetch(`${this.backendUrl}/context/${this.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.cache = data.messages || [];
      }
    } catch (error) {
      console.error('Failed to load context:', error);
    }
  }
  
  /**
   * Add a message to memory
   */
  async addMessage(message: Message): Promise<void> {
    // Add to local cache
    this.cache.push(message);
    
    // Trim cache if needed
    if (this.cache.length > this.maxMessages) {
      this.cache = this.cache.slice(-this.maxMessages);
    }
    
    // Persist to MongoDB
    try {
      await fetch(`${this.backendUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          message
        })
      });
    } catch (error) {
      console.error('Failed to persist message:', error);
    }
  }
  
  /**
   * Get recent messages
   */
  getMessages(limit?: number): Message[] {
    const messageLimit = limit || this.maxMessages;
    return this.cache.slice(-messageLimit);
  }
  
  /**
   * Get formatted context for LLM
   */
  getContext(): string {
    return this.cache
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }
  
  /**
   * Clear conversation history
   */
  async clear(): Promise<void> {
    this.cache = [];
    
    try {
      await fetch(`${this.backendUrl}/clear/${this.userId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }
  
  /**
   * Search conversation history
   */
  async search(query: string): Promise<Message[]> {
    try {
      const response = await fetch(`${this.backendUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          query
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
      
      return [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }
  
  /**
   * Get conversation statistics
   */
  async getStats(): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/stats/${this.userId}`);
      
      if (response.ok) {
        return await response.json();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get stats:', error);
      return null;
    }
  }
}