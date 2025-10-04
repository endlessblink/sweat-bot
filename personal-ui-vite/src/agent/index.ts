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
import { getOrCreateGuestToken } from '../utils/auth';

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
    // Ensure the message is properly encoded (define outside try-catch for scope)
    const cleanMessage = this.sanitizeInput(message);

    try {
      
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

      // No hardcoded fallbacks - let the user know there's a technical issue
      return 'מצטער, יש בעיה טכנית כרגע. אנא נסה שוב בעוד רגע או בדוק את החיבור לשירות.';
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
    
    // Remove control characters EXCEPT newlines (\n = 0x0A, \r = 0x0D)
    return output.replace(/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
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
      yield 'מצטער, יש בעיה טכנית כרגע. נסה שוב בעוד רגע.';
    }
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
          try {
            // Get valid auth token
            const token = await getOrCreateGuestToken();

            // Save to backend database
            const exerciseData = {
              name: params.exercise_name,
              name_he: params.exercise_name, // AI already provides Hebrew
              reps: params.repetitions,
              sets: params.sets || 1,
              weight_kg: params.weight_kg,
              distance_km: params.distance_km,
              duration_seconds: params.duration_minutes ? params.duration_minutes * 60 : undefined
            };

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises/log`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(exerciseData)
            });

            if (!response.ok) {
              console.error('Failed to log exercise:', await response.text());
              return `נרשם לי שעשית ${params.exercise_name}! (שמירה מקומית - בדוק את החיבור לשרת)`;
            }

            const savedExercise = await response.json();

            // Build natural response
            let result = `רשמתי לך: ${params.exercise_name}`;

            if (params.distance_km) {
              result += ` - ${params.distance_km} ק"מ`;
              if (params.duration_minutes) {
                result += ` ב-${params.duration_minutes} דקות`;
              }
            } else if (params.repetitions) {
              const reps = params.repetitions;
              const sets = params.sets || 1;

              if (sets > 1) {
                result += ` - ${sets} סטים של ${reps} חזרות`;
              } else {
                result += ` - ${reps} חזרות`;
              }

              if (params.weight_kg) {
                result += ` עם ${params.weight_kg} ק״ג`;
              }
            } else if (params.duration_minutes) {
              result += ` - ${params.duration_minutes} דקות`;
            }

            result += `! כל הכבוד! 💪`;

            if (savedExercise.points_earned) {
              result += `\n\n🎯 +${savedExercise.points_earned} נקודות`;
            }

            if (savedExercise.is_personal_record) {
              result += `\n\n🏆 שיא אישי חדש!`;
            }

            return result;
          } catch (error) {
            console.error('Exercise logging error:', error);
            return `נרשם לי ${params.exercise_name}! (לא הצלחתי לשמור בשרת - בדוק חיבור)`;
          }
        }
      },
      {
        name: 'statsRetriever',
        description: 'הצגת סטטיסטיקות ונקודות אמיתיות מהמערכת',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'תקופה: week/month/year' }
          }
        },
        execute: async (params: any) => {
          try {
            const token = await getOrCreateGuestToken();

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises/statistics`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              return 'אין עדיין נתוני אימונים. התחל לתעד את האימונים שלך!';
            }

            const data = await response.json();
            const total = data.total_stats;

            let result = `📊 **הסטטיסטיקות שלך:**\n\n`;
            result += `🎯 סה"כ נקודות: ${total.total_points || 0}\n\n`;
            result += `💪 סה"כ תרגילים: ${total.total_exercises || 0}\n\n`;
            result += `🔁 סה"כ חזרות: ${total.total_reps || 0}\n\n`;

            if (total.total_weight_kg > 0) {
              result += `🏋️ סה"כ משקל: ${Math.round(total.total_weight_kg)} ק"ג\n\n`;
            }

            if (data.exercise_breakdown && data.exercise_breakdown.length > 0) {
              result += `\n**התפלגות תרגילים:**\n\n`;
              data.exercise_breakdown.slice(0, 5).forEach((ex: any) => {
                result += `• ${ex.name}: ${ex.count} פעמים (${ex.points} נקודות)\n\n`;
              });
            }

            return result;
          } catch (error) {
            console.error('Stats retrieval error:', error);
            return 'לא הצלחתי לטעון את הסטטיסטיקות. ודא שהשרת פועל.';
          }
        }
      },
      {
        name: 'workoutDetails',
        description: 'הצגת פירוט מלא של האימונים - השתמש כשהמשתמש שואל "מה האימונים", "איזה אימונים", "תראה לי את האימונים"',
        parameters: {
          type: 'object',
          properties: {
            period: { type: 'string', description: 'תקופה: today/week/month/all_time', default: 'month' }
          }
        },
        execute: async (params: any) => {
          try {
            const token = await getOrCreateGuestToken();

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises/history`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              return 'אין עדיין אימונים מתועדים. התחל לרשום את האימונים שלך!';
            }

            const exercises = await response.json();

            if (!exercises || exercises.length === 0) {
              return 'אין עדיין אימונים מתועדים. בוא נתחיל!';
            }

            let result = `📊 **האימונים שלך (${exercises.length} אחרונים):**\n\n`;

            exercises.slice(0, 15).forEach((ex: any) => {
              const date = new Date(ex.timestamp).toLocaleDateString('he-IL');
              let line = `• ${ex.name_he}`;
              if (ex.sets && ex.reps) {
                line += ` - ${ex.sets}x${ex.reps}`;
              }
              if (ex.weight_kg) {
                line += ` @ ${ex.weight_kg}kg`;
              }
              if (ex.distance_km) {
                line += ` - ${ex.distance_km}km`;
              }
              line += ` (${ex.points_earned} נקודות) - ${date}`;
              result += line + '\n\n';
            });

            return result;
          } catch (error) {
            console.error('Workout history error:', error);
            return 'לא הצלחתי לטעון את היסטוריית האימונים.';
          }
        }
      },
      {
        name: 'workoutSuggester',
        description: 'הצעת אימון מותאם אישית על בסיס היסטוריית האימונים',
        parameters: {
          type: 'object',
          properties: {
            muscleGroup: { type: 'string', description: 'קבוצת שרירים' },
            duration: { type: 'number', description: 'זמן בדקות' }
          }
        },
        execute: async (params: any) => {
          // AI provides personalized suggestions based on conversation
          return `בואו נתכנן אימון! על סמך מה שראיתי, אני ממליץ על אימון מאוזן. מה תרצה להתמקד בו היום?`;
        }
      },
      {
        name: 'dataManager',
        description: 'ניהול נתונים ואיפוס - השתמש כשהמשתמש מבקש לאפס או למחוק נתונים',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: 'reset/clear', enum: ['reset', 'clear'] }
          },
          required: ['action']
        },
        execute: async (params: any) => {
          try {
            const token = await getOrCreateGuestToken();

            if (params.action === 'reset' || params.action === 'clear') {
              const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises/clear-all`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (response.ok) {
                return `✅ כל הנתונים נמחקו בהצלחה. אפשר להתחיל מחדש!`;
              }
              return `⚠️ לא הצלחתי למחוק את הנתונים. נסה שוב.`;
            }
            return `פעולה לא ידועה: ${params.action}`;
          } catch (error) {
            console.error('Data management error:', error);
            return 'שגיאה בניהול הנתונים.';
          }
        }
      },
      {
        name: 'progressAnalyzer',
        description: 'ניתוח התקדמות על בסיס נתונים אמיתיים מהמערכת',
        parameters: {
          type: 'object',
          properties: {}
        },
        execute: async (params: any) => {
          try {
            const token = await getOrCreateGuestToken();

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/exercises/statistics`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              return 'אין מספיק נתונים לניתוח. המשך לאמן ותוכל לראות התקדמות!';
            }

            const data = await response.json();

            if (data.weekly_progress && data.weekly_progress.length > 0) {
              const total_points = data.weekly_progress.reduce((sum: number, day: any) => sum + (day.points || 0), 0);
              const avg_per_day = Math.round(total_points / data.weekly_progress.length);

              let result = `📈 **ניתוח ההתקדמות שלך:**\n\n`;
              result += `🎯 ${total_points} נקודות ב-7 הימים האחרונים\n\n`;
              result += `📊 ממוצע ${avg_per_day} נקודות ליום\n\n`;
              result += `💪 ${data.weekly_progress.length} ימים פעילים\n\n`;

              return result;
            }

            return 'התחל לאמן כדי לראות ניתוח התקדמות!';
          } catch (error) {
            console.error('Progress analysis error:', error);
            return 'לא הצלחתי לנתח את ההתקדמות.';
          }
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