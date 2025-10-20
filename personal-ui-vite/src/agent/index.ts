/**
 * SweatBot Agent - Secure Backend Proxy Implementation
 * All API keys managed server-side - completely secure!
 */

import { aiClient, RateLimitException } from '../services/aiClient';
import { sanitizeResponse, isResponseSafe } from './utils/responseSanitizer';
import { getOrCreateGuestToken } from '../utils/auth';
import { getBackendUrl } from '../utils/env';

export interface SweatBotConfig {
  userId?: string;
  preferredModel?: 'gemini' | 'groq' | 'local';
  enableMemory?: boolean;
}

interface ConversationState {
  waitingForExerciseDetails: boolean;
  lastUserIntent: 'exercise_update' | 'stats' | 'workout' | 'general' | null;
  lastPromptedFor: string | null;
  lastQuickWorkoutResponse: string | null;
}

export class SweatBotAgent {
  private userId: string;
  private conversationHistory: Array<{role: string, content: string, timestamp?: string}> = [];
  private conversationState: ConversationState = {
    waitingForExerciseDetails: false,
    lastUserIntent: null,
    lastPromptedFor: null,
    lastQuickWorkoutResponse: null
  };
  private sessionId: string | null = null;
  private memoryInitialized: boolean = false;
  private tools: any[];

  constructor(config: SweatBotConfig = {}) {
    this.userId = config.userId || 'personal';

    // Initialize tools
    this.tools = this.getTools();

    // Load conversation history from MongoDB (async, non-blocking)
    this.loadConversationHistory().catch(err => {
      console.warn('Could not load conversation history:', err);
    });

    console.log('✅ SweatBotAgent initialized with secure backend proxy');
  }

  // MongoDB persistence method
  private async persistMessage(role: string, content: string): Promise<void> {
    try {
      const token = await getOrCreateGuestToken();

      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/memory/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          message: {
            role,
            content,
            timestamp: new Date().toISOString()
          },
          sessionId: this.sessionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.session_id) {
          this.sessionId = result.session_id;
        }
        console.log('✅ Message persisted to MongoDB:', result.session_id);
      }
    } catch (error) {
      console.warn('⚠️ MongoDB persistence failed (offline?), message saved locally:', error);
    }
  }

  private async loadConversationHistory(): Promise<void> {
    if (this.memoryInitialized) return;

    try {
      const token = await getOrCreateGuestToken();

      const backendUrl = getBackendUrl();
      const response = await fetch(
        `${backendUrl}/api/memory/context/${this.userId}?limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.messages && data.messages.length > 0) {
          // Load messages into local cache
          this.conversationHistory = data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp
          }));

          // Store session ID
          if (data.session_id) {
            this.sessionId = data.session_id;
          }

          console.log(`✅ Loaded ${data.messages.length} messages from MongoDB (session: ${this.sessionId})`);
          console.log(`   Total messages in session: ${data.total_messages}`);
        } else {
          console.log('ℹ️ No previous conversation history found - starting fresh');
        }
      } else {
        console.warn('⚠️ Could not load conversation history from server');
      }

      this.memoryInitialized = true;
    } catch (error) {
      console.warn('⚠️ Failed to load conversation history (offline?):', error);
      this.memoryInitialized = true; // Don't retry
    }
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
4. **🚨 CRITICAL: גיוון מלא ומוחלט**: כשמציעים אימון (5 דקות או הפסקה), חובה לבחור תרגילים שונים לחלוטין מהפעם הקודמת!

   **מאגר תרגילים (20+ אפשרויות):**
   - סקוואטים (כיפופי ברכיים)
   - לאנג'ים (צעדים)
   - שכיבות שימוש (push-ups) - **חשוב: לעולם לא "שכיבות סמיכה"!**
   - פלנק
   - ברפי
   - Jumping Jacks - **חובה באנגלית!**
   - הרמות ברכיים
   - שכיבות צד (side plank)
   - ריצה במקום
   - הליכה מהירה
   - Mountain Climbers - **חובה באנגלית!**
   - כפיפות בטן (crunches)
   - Russian Twists - **חובה באנגלית!**
   - הרמות רגליים
   - גשר ישבן (glute bridge)
   - כיפוף גב (superman)
   - שכיבות זוגיות עם סיבוב
   - קפיצות חד רגלית
   - פלנק דינמי
   - שכיבות רגליים (leg raises)

   **אסור מוחלט:**
   - ❌ אין להציע טיפוס חבל (אלא אם ביקשו)
   - ❌ אין להציע תרגילים עם ציוד (אלא אם ביקשו)
   - ❌ אין לחזור על אותה קבוצת תרגילים!

5. **רנדומיזציה מלאה**:
   - בכל בקשה לאימון קצר - החלף לפחות 3-4 תרגילים מהפעם הקודמת
   - שנה את הסדר לחלוטין
   - גוון במשך/חזרות (לא תמיד אותם מספרים)
   - אם קיבלת רשימת תרגילים קודמים להימנע מהם - אל תשתמש בהם!

6. **חזרות ומשכי זמן**: לכל תרגיל חייב להיות מספר חזרות או משך (לדוגמה "20 חזרות" או "40 שניות"). גוון במספרים!

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
- goalSetter: כשמשתמש רוצה להגדיר יעד
- progressAnalyzer: כשמשתמש שואל על מגמות
- dataManager: כשמשתמש רוצה לאפס או לנהל נתונים
- רעיונות לאימון קצר (למשל "5 דקות", "הפסקה"): אל תפעיל כלי. תן הצעה מגוונת מהירה שמורכבת מתרגילי משקל גוף פשוטים וללא ציוד.

זכור: אתה מאמן כושר חכם שמבין עברית מצוין - תבין מהקונטקסט ופעל בהתאם! 🏃‍♂️`;
  }
  
  async chat(message: string): Promise<string> {
    const cleanMessage = this.sanitizeInput(message);

    try {
      const isQuickBreakRequest = this.isQuickBreakRequest(cleanMessage);
      let enrichedMessage = cleanMessage;

      if (isQuickBreakRequest) {
        const variationSeed = Math.random().toString(36).slice(2, 8);
        enrichedMessage += `\n\nהנחיות הפקה: עליך להציע אימון קצר (5 דקות או פחות) המורכב מתרגילי משקל גוף פשוטים בלבד. כל תרגיל חייב לכלול מספר חזרות או משך זמן. אל תחזור על אותו צירוף תרגילים, הימנע מטיפוס חבל ותרגילים עם ציוד אם לא ביקשו זאת. seed=${variationSeed}`;
        if (this.conversationState.lastQuickWorkoutResponse) {
          enrichedMessage += `\n\nהצעות קודמות שיש להימנע מהן: ${this.conversationState.lastQuickWorkoutResponse}`;
        }
      }

      // Build messages for backend AI proxy
      const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        { role: 'system', content: this.getSystemPrompt() }
      ];

      // Add conversation context (last 5 messages)
      this.conversationHistory.slice(-5).forEach(m => {
        messages.push({
          role: m.role as 'user' | 'assistant',
          content: m.content
        });
      });

      // Add current user message
      messages.push({ role: 'user', content: enrichedMessage });

      // Call backend AI proxy (SECURE - no API keys in frontend!)
      console.log('🔒 SweatBotAgent: Calling secure backend proxy...');
      const response = await aiClient.chat({
        messages,
        tools: this.tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        })),
        temperature: 0.9  // Higher temperature for variety
      });

      console.log(`✅ Response from ${response.provider}/${response.model} - ${response.usage.total_tokens} tokens`);

      let finalResponse = response.content;

      // Handle tool calls from backend
      if (response.tool_calls && response.tool_calls.length > 0) {
        console.log(`🔧 Executing ${response.tool_calls.length} tool(s)...`);
        const toolResults = await this.executeTools(response.tool_calls);
        finalResponse = toolResults.map(r => r.result).join('\n\n');
      }

      // Validate response safety before returning
      if (!isResponseSafe(finalResponse)) {
        console.warn('Response contains function definitions, sanitizing');
        console.log('[DEBUG] Response before sanitize:', JSON.stringify(finalResponse));
        finalResponse = sanitizeResponse(finalResponse, { lastUserMessage: cleanMessage });
        console.log('[DEBUG] Response after sanitize:', JSON.stringify(finalResponse));
      }

      // Store in conversation history
      this.conversationHistory.push({role: 'user', content: cleanMessage, timestamp: new Date().toISOString()});
      this.conversationHistory.push({role: 'assistant', content: finalResponse, timestamp: new Date().toISOString()});

      // Persist to MongoDB (async, non-blocking)
      this.persistMessage('user', cleanMessage).catch(err => console.warn('Failed to persist user message:', err));
      this.persistMessage('assistant', finalResponse).catch(err => console.warn('Failed to persist assistant message:', err));

      if (isQuickBreakRequest) {
        this.conversationState.lastQuickWorkoutResponse = finalResponse;
      }

      return this.sanitizeOutput(finalResponse);

    } catch (error) {
      if (error instanceof RateLimitException) {
        const hours = Math.floor(error.retryAfter / 3600);
        return `⚠️ הגעת למגבלת ההודעות היומית (10 הודעות ביום חינם). נסה שוב בעוד ${hours} שעות, או שדרג לחשבון פרימיום לשימוש בלתי מוגבל! 🌟`;
      }

      console.error('SweatBot chat error:', error);
      return 'מצטער, יש בעיה טכנית כרגע. אנא נסה שוב בעוד רגע.';
    }
  }

  /**
   * Execute tools locally based on backend AI's tool calls
   */
  private async executeTools(toolCalls: Array<{id: string, name: string, arguments: string}>): Promise<any[]> {
    const results = [];

    for (const call of toolCalls) {
      const tool = this.tools.find(t => t.name === call.name);
      if (tool) {
        try {
          const args = JSON.parse(call.arguments);
          console.log(`🔧 Executing tool: ${call.name} with args:`, args);
          const result = await tool.execute(args);
          results.push({ name: call.name, result });
          console.log(`✅ Tool ${call.name} completed`);
        } catch (error) {
          console.error(`❌ Tool ${call.name} execution failed:`, error);
          results.push({ name: call.name, result: 'כלי נכשל - נסה שוב' });
        }
      } else {
        console.warn(`⚠️ Tool ${call.name} not found`);
      }
    }

    return results;
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

  private isQuickBreakRequest(message: string): boolean {
    const normalized = message.toLowerCase();
    const keywords = ['5 דקות', 'חמש דקות', 'הפסקה', 'break', 'מיקרו אימון', 'אימון קצר'];
    return keywords.some(keyword => normalized.includes(keyword));
  }
  
  async *chatStream(message: string) {
    // Streaming not yet implemented with backend proxy
    // Fall back to regular chat
    try {
      const response = await this.chat(message);
      yield response;
    } catch (error) {
      console.error('SweatBot stream error:', error);
      yield 'מצטער, יש בעיה טכנית כרגע. נסה שוב בעוד רגע.';
    }
  }

  getStatus() {
    return {
      userId: this.userId,
      proxyMode: true,  // Using secure backend proxy!
      tools: this.tools?.length || 0,
      memoryEnabled: true,
      sessionId: this.sessionId,
      messagesLoaded: this.conversationHistory.length
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

            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/exercises/log`, {
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

            // Add link to statistics
            result += `\n\n[ראה סטטיסטיקות]`;

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
        execute: async (_params: any) => {
          try {
            const token = await getOrCreateGuestToken();

            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/exercises/statistics`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              return 'אין עדיין נתוני אימונים. התחל לתעד את האימונים שלך!';
            }

            const data = await response.json();
            const total = data.total_stats ?? data;

            let result = `📊 **הסטטיסטיקות שלך:**\n\n`;
            result += `🎯 סה"כ נקודות: ${(total.total_points ?? total.weekly_points ?? total.monthly_points ?? 0)}\n\n`;
            result += `💪 סה"כ תרגילים: ${total.total_exercises || 0}\n\n`;
            result += `🔁 סה"כ חזרות: ${total.total_reps || 0}\n\n`;

            if ((total.total_weight_kg || 0) > 0) {
              result += `🏋️ סה"כ משקל: ${Math.round(total.total_weight_kg)} ק"ג\n\n`;
            }

            if (data.exercise_breakdown && data.exercise_breakdown.length > 0) {
              result += `\n**התפלגות תרגילים:**\n\n`;
              data.exercise_breakdown.slice(0, 5).forEach((ex: any) => {
                result += `• ${ex.name}: ${ex.count} פעמים (${ex.points} נקודות)\n\n`;
              });
            }

            return `${result}\n[ראה סטטיסטיקות]`;
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
        execute: async (_params: any) => {
          try {
            const token = await getOrCreateGuestToken();

            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/exercises/history`, {
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
              const backendUrl = getBackendUrl();
              const response = await fetch(`${backendUrl}/exercises/clear-all`, {
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

            const backendUrl = getBackendUrl();
            const response = await fetch(`${backendUrl}/exercises/statistics`, {
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
