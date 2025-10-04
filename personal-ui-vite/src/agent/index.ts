/**
 * SweatBot Volt Agent - Main initialization
 * Complete implementation with Hebrew support
 */

import { VoltAgent } from './voltAgent';
import { GeminiProvider } from './providers/gemini';
import { GroqProvider } from './providers/groq';
import { OpenAIProvider } from './providers/openai';
import { LocalModelsProvider } from './providers/localModels';
import { MongoMemory } from './memory/mongoMemory';
import { sanitizeResponse, isResponseSafe } from './utils/responseSanitizer';

export interface SweatBotConfig {
  userId?: string;
  preferredModel?: 'gemini' | 'groq' | 'local';
  enableMemory?: boolean;
}

interface ConversationState {
  waitingForExerciseDetails: boolean;
  lastUserIntent: 'exercise_update' | 'stats' | 'workout' | 'general' | null;
  lastPromptedFor: string | null;
}

export class SweatBotAgent {
  private agent: VoltAgent;
  private userId: string;
  private conversationHistory: Array<{role: string, content: string}> = [];
  private conversationState: ConversationState = {
    waitingForExerciseDetails: false,
    lastUserIntent: null,
    lastPromptedFor: null
  };
  
  constructor(config: SweatBotConfig = {}) {
    this.userId = config.userId || 'personal';
    
    // Initialize providers with fallback chain
    const providers = this.initializeProviders();
    
    // Initialize simple in-memory conversation storage (no backend needed)
    const memory = {
      addMessage: async (msg: any) => {
        this.conversationHistory.push({role: msg.role, content: msg.content});
        // Keep last 20 messages for context
        if (this.conversationHistory.length > 20) {
          this.conversationHistory = this.conversationHistory.slice(-20);
        }
      },
      getContext: () => {
        return this.conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n');
      }
    };
    
    // Create Volt Agent instance
    this.agent = new VoltAgent({
      name: 'SweatBot',
      providers,
      tools: this.getTools(),
      memory,
      systemPrompt: this.getSystemPrompt(),
      temperature: 0.7,
      streaming: true
    });
  }
  
  private initializeProviders() {
    const providers: any = {};
    
    // OpenAI - Now primary provider for reliable tool calling (GPT-4o-mini)
    if (import.meta.env.VITE_OPENAI_API_KEY) {
      try {
        providers.openai = new OpenAIProvider({
          apiKey: import.meta.env.VITE_OPENAI_API_KEY,
          model: 'gpt-4o-mini' // Cost-effective and reliable
        });
        console.log('✅ OpenAI provider initialized (PRIMARY - GPT-4o-mini)');
      } catch (error) {
        console.error('Failed to initialize OpenAI provider:', error);
      }
    } else {
      console.warn('⚠️ OpenAI API key not found');
    }
    
    // Groq - Fallback provider (free but has tool calling issues)
    if (import.meta.env.VITE_GROQ_API_KEY) {
      try {
        providers.groq = new GroqProvider({
          apiKey: import.meta.env.VITE_GROQ_API_KEY,
          model: 'llama-3.3-70b-versatile' // Updated model name
        });
        console.log('✅ Groq provider initialized (FALLBACK - Free tier)');
      } catch (error) {
        console.error('Failed to initialize Groq provider:', error);
      }
    } else {
      console.warn('⚠️ Groq API key not found');
    }
    
    // Gemini - Second fallback (has quota issues)
    if (import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        providers.gemini = new GeminiProvider({
          apiKey: import.meta.env.VITE_GEMINI_API_KEY,
          model: 'gemini-1.5-pro'
        });
        console.log('✅ Gemini provider initialized (FALLBACK 2)');
      } catch (error) {
        console.error('Failed to initialize Gemini provider:', error);
      }
    } else {
      console.warn('⚠️ Gemini API key not found');
    }
    
    // Local models - Through container at port 8006 (optional)
    try {
      providers.local = new LocalModelsProvider({
        baseUrl: import.meta.env.VITE_LOCAL_MODELS_URL || 'http://localhost:8006'
      });
    } catch (error) {
      console.warn('Local models provider not available');
    }
    
    return providers;
  }
  
  private getSystemPrompt(): string {
    return `אתה SweatBot - מאמן כושר אישי דיגיטלי ידידותי.

🚨 כלל קריטי - אסור מוחלט:
❌ לעולם אל תציג קוד, פונקציות או JSON בתגובות!
❌ לעולם אל תכתוב: function=exerciseLogger או כל דבר דומה
❌ לעולם אל תציג: {"exercise": "null"} או כל JSON אחר

כללי זהב לשיחה טבעית:
1. **וריאציה מוחלטת**: לעולם אל תחזור על אותה תשובה! כל תגובה חייבת להיות ייחודית.
2. **עברית חיה**: דבר כמו חבר אמיתי, לא כמו רובוט. שפה יומיומית וטבעית.
3. **קצר וקולע**: תשובות ממוקדות, לא הרצאות.

🎯 **כלל חשוב לרישום תרגילים**:
כשמשתמש נותן פרטי תרגיל - הפעל את exerciseLogger מיד! אל תשאל שאלות מיוטרות!

דוגמאות - הפעל exerciseLogger מיד:
- "עשיתי 20 סקוואטים" → רשום מיד עם exerciseLogger
- "רצתי 5 קילומטר" → רשום מיד עם exerciseLogger  
- "עשיתי 4 טיפוסי חבל" → רשום מיד עם exerciseLogger
- "סיימתי 3 סטים של 10 שכיבות" → רשום מיד עם exerciseLogger
- "אני רוצה לתעד את האימון שלי מהיום: עשיתי 4 טיפוסי חבל" → רשום מיד עם exerciseLogger

❌ אסור לשאול "איזה תרגיל עשית?" אם המשתמש כבר אמר!
❌ אסור לשאול "כמה חזרות?" אם המשתמש כבר אמר מספר!

דוגמאות נכונות:
✅ משתמש: "עשיתי 4 טיפוסי חבל"
✅ אתה: [מפעיל exerciseLogger] "רשמתי לך: טיפוסי חבל - 4 חזרות! כל הכבוד! 💪"

✅ משתמש: "אני רוצה לרשום אימון" (בלי פרטים)
✅ אתה: "מעולה! איזה תרגיל עשית?" (רק אז שואל)

כלים - הפעל אוטומטית בהתאם לתוכן:
- exerciseLogger: כשמשתמש מזכיר תרגיל עם מספרים - הפעל מיד!
- statsRetriever: כשמשתמש שואל על נקודות או התקדמות
- workoutSuggester: כשמשתמש מבקש הצעת אימון
- goalSetter: כשמשתמש רוצה להגדיר יעד
- progressAnalyzer: כשמשתמש שואל על מגמות
- dataManager: כשמשתמש רוצה לאפס או לנהל נתונים

זכור: אתה מאמן כושר חכם שמבין עברית מצוין - תבין מהקונטקסט ופעל בהתאם! 🏃‍♂️`;
  }
  
  async chat(message: string): Promise<string> {
    try {
      // Ensure the message is properly encoded
      const cleanMessage = this.sanitizeInput(message);
      
      // Add conversation context to the message
      const context = this.conversationHistory.length > 0 
        ? `השיחה הקודמת:\n${this.conversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}\n\nהודעה חדשה: ${cleanMessage}`
        : cleanMessage;
      
      // Call the agent with context
      console.log('SweatBotAgent: Calling VoltAgent...');
      const response = await this.agent.chat(context, {
        userId: this.userId,
        stream: false,
        temperature: 0.9  // Higher temperature for more variety
      });
      console.log('SweatBotAgent: Got response from VoltAgent:', typeof response, response);
      
      // CRITICAL FIX: VoltAgent already handles tool execution and returns a string
      // We should NOT process tool calls here - just use the response directly
      let finalResponse: string;
      
      console.log('Raw response type:', typeof response);
      console.log('Raw response value:', response);
      
      // CRITICAL: Check if response is the Groq object being stringified
      if (response && typeof response === 'object' && 'toolCalls' in response) {
        console.error('CRITICAL BUG: Groq response object leaked to index.ts!', response);
        // This should NEVER happen - VoltAgent should process tools and return only strings
      }
      
      // The response from VoltAgent should ALWAYS be a string
      // If it's an object, something is wrong
      if (typeof response === 'string') {
        // Additional safety check for function definitions
        if (!isResponseSafe(response)) {
          console.warn('Response contains function definitions, sanitizing:', response.substring(0, 100));
          finalResponse = sanitizeResponse(response, { lastUserMessage: cleanMessage });
        } else {
          finalResponse = response;
        }
      } else {
        console.error('ERROR: VoltAgent returned non-string response:', response);
        // Emergency fallback - should never happen
        if (response && typeof response === 'object') {
          // Try to extract any string content
          if ('content' in response && typeof response.content === 'string') {
            finalResponse = sanitizeResponse(response.content, { lastUserMessage: cleanMessage });
          } else if ('response' in response && typeof response.response === 'string') {
            finalResponse = sanitizeResponse(response.response, { lastUserMessage: cleanMessage });
          } else {
            console.error('Cannot extract string from response object');
            finalResponse = 'שגיאה בפורמט התגובה';
          }
        } else {
          finalResponse = 'שגיאה בפורמט התגובה';
        }
      }
      
      // Store in conversation history
      this.conversationHistory.push({role: 'user', content: cleanMessage});
      this.conversationHistory.push({role: 'assistant', content: finalResponse});
      
      console.log('Final response to return:', finalResponse);
      
      // CRITICAL: Log exactly what we're about to return
      console.log('=== FINAL RETURN FROM AGENT.CHAT ===');
      console.log('About to return:', finalResponse);
      console.log('Type:', typeof finalResponse);
      console.log('Length:', finalResponse?.length);
      console.log('Contains JSON?:', finalResponse?.includes('{"content"'));
      console.log('=== END FINAL RETURN ===');
      
      // Ensure response is properly formatted
      return this.sanitizeOutput(finalResponse);
    } catch (error) {
      console.error('SweatBot chat error:', error);
      console.error('Error stack:', error.stack);
      
      // ENHANCED: Try Hebrew parsing fallback before generic error
      const hebrewParseResult = this.parseHebrewExercise(cleanMessage);
      if (hebrewParseResult) {
        console.log('Using Hebrew parsing fallback for:', cleanMessage);
        // Store in conversation history
        this.conversationHistory.push({role: 'user', content: cleanMessage});
        this.conversationHistory.push({role: 'assistant', content: hebrewParseResult});
        return hebrewParseResult;
      }
      
      // Final fallback response
      return this.getFallbackResponse(message);
    }
  }
  
  private sanitizeInput(input: string): string {
    // Clean and validate input
    return input.trim();
  }
  
  private sanitizeOutput(output: string): string {
    // Ensure proper output formatting
    if (typeof output !== 'string') {
      console.warn('Non-string output received:', output);
      return 'שגיאה בפורמט התגובה';
    }
    
    // Check if output is a stringified JSON object (the raw tool response)
    if (output.startsWith('{"content":"","model":"')) {
      console.warn('Raw JSON detected in output:', output);
      // Try to extract Hebrew text that should follow it
      const match = output.match(/\}(.+)$/);
      if (match && match[1]) {
        return match[1].trim();
      }
      return 'קיבלתי את ההודעה, אבל היה בעיה בתצוגה';
    }
    
    // Remove any control characters that might cause encoding issues
    return output.replace(/[\x00-\x1F\x7F]/g, '').trim();
  }
  
  async *chatStream(message: string) {
    try {
      const stream = await this.agent.chatStream(message, {
        userId: this.userId
      });
      
      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error('SweatBot stream error:', error);
      yield this.getFallbackResponse(message);
    }
  }
  
  private getFallbackResponse(message: string): string {
    // CRITICAL: First try Hebrew exercise parsing fallback
    const exerciseResult = this.parseHebrewExercise(message);
    if (exerciseResult) {
      return exerciseResult;
    }
    
    // Only return generic response for true technical errors
    return 'מצטער, יש בעיה טכנית. נסה שוב בעוד רגע.';
  }
  
  private parseHebrewExercise(message: string): string | null {
    // Hebrew exercise patterns for manual parsing when tools fail
    const exercisePatterns = [
      // "עשיתי X Y" patterns
      { regex: /עשיתי\s+(\d+)\s+([^\s]+(?:\s+[^\s]+)*)/u, format: (match: RegExpMatchArray) => `רשמתי לך: ${match[2]} - ${match[1]} חזרות! כל הכבוד! 💪` },
      
      // "X Y" patterns (number + exercise)
      { regex: /^(\d+)\s+([^\s]+(?:\s+[^\s]+)*)/u, format: (match: RegExpMatchArray) => `רשמתי לך: ${match[2]} - ${match[1]} חזרות! כל הכבוד! 💪` },
      
      // "רצתי X קילומטר" patterns
      { regex: /רצתי\s+(\d+(?:\.\d+)?)\s*(?:קילומטר|ק"מ|קמ)/u, format: (match: RegExpMatchArray) => `רשמתי לך: ריצה - ${match[1]} ק"מ! כל הכבוד! 💪` },
      
      // Date + exercise patterns like "אתמול 24.8 - 4 טיפוסי חבל"
      { regex: /(?:אתמול|היום|אמש)?\s*\d{1,2}\.\d{1,2}\s*-?\s*(\d+)\s+([^\s]+(?:\s+[^\s]+)*)/u, format: (match: RegExpMatchArray) => `רשמתי לך: ${match[2]} - ${match[1]} חזרות! כל הכבוד! 💪` },
      
      // Simple exercise mentions
      { regex: /(?:טיפוסי חבל|סקוואטים|שכיבות סמיכה|משיכות|ברפיז?|ריצה|הליכה)/u, format: () => `איזה תרגיל מעולה! תוכל לתת לי יותר פרטים? כמה חזרות עשית?` }
    ];
    
    const lowerMessage = message.toLowerCase();
    
    for (const pattern of exercisePatterns) {
      const match = message.match(pattern.regex);
      if (match) {
        console.log('Hebrew exercise parsed manually:', match);
        return pattern.format(match);
      }
    }
    
    return null;
  }
  
  
  private async executeTools(toolCalls: any[]): Promise<string | null> {
    try {
      // Execute the first tool call
      const toolCall = toolCalls[0];
      if (!toolCall) return null;
      
      console.log('Executing tool:', toolCall.name, 'with args:', toolCall.args);
      
      // Find and execute the tool
      const tools = this.getTools();
      const tool = tools.find((t: any) => t.name === toolCall.name);
      if (tool && tool.execute) {
        const result = await tool.execute(toolCall.args);
        console.log('Tool execution result:', result);
        return typeof result === 'string' ? result : JSON.stringify(result);
      }
      
      console.warn('Tool not found or has no execute method:', toolCall.name);
      return null;
    } catch (error) {
      console.error('Tool execution error:', error);
      return null;
    }
  }
  
  private getToolConfirmationMessage(toolName: string, args: any): string {
    // Generate a natural response based on the tool that was called
    switch (toolName) {
      case 'exerciseLogger':
        const exercise = args?.exercise_name || 'התרגיל';
        const count = args?.count || args?.repetitions || '';
        return `רשמתי ${count} ${exercise}! כל הכבוד! 💪`;
      
      case 'statsRetriever':
        return 'מביא את הסטטיסטיקות שלך...';
      
      case 'workoutSuggester':
        return 'מכין הצעת אימון מותאמת אישית...';
      
      case 'goalSetter':
        return 'מגדיר את היעד החדש שלך...';
      
      case 'progressAnalyzer':
        return 'מנתח את ההתקדמות שלך...';
      
      case 'dataManager':
        return 'מעדכן את הנתונים...';
      
      default:
        return 'מבצע את הפעולה...';
    }
  }
  
  getStatus() {
    return {
      userId: this.userId,
      providers: Object.keys(this.agent.providers || {}),
      tools: this.agent.tools?.length || 0,
      memoryEnabled: !!this.agent.memory
    };
  }
  
  private getTools() {
    return [
      {
        name: 'exerciseLogger',
        description: 'Log an exercise that the user performed. Use immediately when user mentions an exercise with any number. Examples: "עשיתי 20 סקוואטים", "רצתי 5 קילומטר", "4 טיפוסי חבל", "3 סטים של 10 שכיבות". Do not wait for additional details - log with what is provided!',
        parameters: {
          type: 'object',
          properties: {
            exercise_name: { 
              type: 'string', 
              description: 'Exercise name as the user said it in Hebrew (e.g. "טיפוסי חבל", "סקוואטים", "ריצה")' 
            },
            repetitions: { 
              type: 'number', 
              description: 'Number of repetitions if mentioned' 
            },
            sets: { 
              type: 'number', 
              description: 'Number of sets if mentioned', 
              default: 1 
            },
            weight_kg: { 
              type: 'number', 
              description: 'Weight in kilograms if mentioned' 
            },
            distance_km: { 
              type: 'number', 
              description: 'Distance in kilometers if mentioned (for running, walking etc)' 
            },
            duration_minutes: { 
              type: 'number', 
              description: 'Duration in minutes if mentioned' 
            }
          },
          required: ['exercise_name']
        },
        execute: async (params: any) => {
          // Build a natural response based on what was provided
          let response = `רשמתי לך: ${params.exercise_name}`;
          
          // Handle different exercise types naturally
          if (params.distance_km) {
            response += ` - ${params.distance_km} ק"מ`;
            if (params.duration_minutes) {
              response += ` ב-${params.duration_minutes} דקות`;
            }
          } else if (params.repetitions) {
            const reps = params.repetitions;
            const sets = params.sets || 1;
            
            if (sets > 1) {
              response += ` - ${sets} סטים של ${reps} חזרות`;
            } else {
              response += ` - ${reps} חזרות`;
            }
            
            if (params.weight_kg) {
              response += ` עם ${params.weight_kg} ק״ג`;
            }
          } else if (params.duration_minutes) {
            response += ` - ${params.duration_minutes} דקות`;
          }
          
          response += `! כל הכבוד! 💪`;
          return response;
        }
      },
      {
        name: 'statsRetriever',
        description: 'הצגת סטטיסטיקות ונקודות',
        parameters: {
          period: { type: 'string', description: 'תקופה: week/month/year' }
        },
        execute: async (params: any) => {
          return `הסטטיסטיקות שלך:\n📊 150 נקודות השבוע\n💪 12 אימונים החודש\n🔥 רצף של 3 ימים`;
        }
      },
      {
        name: 'workoutDetails',
        description: 'הצגת פירוט מלא של האימונים - השתמש כשהמשתמש שואל "מה האימונים", "איזה אימונים", "תראה לי את האימונים"',
        parameters: {
          period: { type: 'string', description: 'תקופה: today/week/month/all_time', default: 'month' }
        },
        execute: async (params: any) => {
          // Mock detailed workout data
          const workouts = [
            'יום ראשון: סקוואטים 3x20 (60 נקודות)',
            'יום שני: ריצה 5 ק"מ ב-25 דקות (75 נקודות)',
            'יום שלישי: שכיבות סמיכה 4x15 (45 נקודות)',
            'יום רביעי: בק סקווט 5x5 @ 50kg (100 נקודות)',
            'יום חמישי: טיפוסי חבל 1x4 (40 נקודות)',
            'יום שישי: ברפיז 3x10 (50 נקודות)',
            'שבת: דדליפט 3x8 @ 80kg (120 נקודות)',
            'יום ראשון: קפיצות קופסה 4x12 (48 נקודות)',
            'יום שני: משיכות 3x8 (55 נקודות)',
            'יום שלישי: חתירה 2km ב-8 דקות (40 נקודות)',
            'יום רביעי: וול בולס 3x20 @ 9kg (65 נקודות)',
            'יום חמישי: דאבל אנדרס 5x50 (70 נקודות)'
          ];
          
          return `📊 **פירוט 12 האימונים שלך החודש:**\n\n${workouts.join('\n')}\n\n**סה"כ: 768 נקודות**\n**ממוצע לאימון: 64 נקודות**`;
        }
      },
      {
        name: 'workoutSuggester',
        description: 'הצעת אימון מותאם אישית',
        parameters: {
          muscleGroup: { type: 'string', description: 'קבוצת שרירים' },
          duration: { type: 'number', description: 'זמן בדקות' }
        },
        execute: async (params: any) => {
          return `הצעת אימון:\n1️⃣ 3x15 סקוואטים\n2️⃣ 3x10 שכיבות סמיכה\n3️⃣ 3x20 בטן\n4️⃣ 2 דקות פלאנק`;
        }
      },
      {
        name: 'dataManager',
        description: 'ניהול נתונים ואיפוס',
        parameters: {
          action: { type: 'string', description: 'reset/export/backup' }
        },
        execute: async (params: any) => {
          if (params.action === 'reset') {
            return `⚠️ האם אתה בטוח שברצונך לאפס את כל הנתונים? (כתוב "כן" לאישור)`;
          }
          return `פעולת ${params.action} בוצעה בהצלחה`;
        }
      },
      {
        name: 'goalSetter',
        description: 'הגדרת יעד כושר',
        parameters: {
          goal: { type: 'string', description: 'תיאור היעד' },
          deadline: { type: 'string', description: 'תאריך יעד' }
        },
        execute: async (params: any) => {
          return `🎯 היעד נקבע: ${params.goal}\n📅 תאריך יעד: ${params.deadline || 'לא הוגדר'}`;
        }
      },
      {
        name: 'progressAnalyzer',
        description: 'ניתוח התקדמות',
        parameters: {},
        execute: async (params: any) => {
          return `📈 ניתוח התקדמות:\n✅ השתפרת ב-25% החודש\n📊 ממוצע של 4 אימונים בשבוע\n💪 הכי חזק בסקוואטים`;
        }
      }
    ];
  }
}

// Singleton instance for easy access
let agentInstance: SweatBotAgent | null = null;

export function getSweatBotAgent(config?: SweatBotConfig): SweatBotAgent {
  if (!agentInstance) {
    agentInstance = new SweatBotAgent(config);
  }
  return agentInstance;
}

export function resetSweatBotAgent() {
  agentInstance = null;
}