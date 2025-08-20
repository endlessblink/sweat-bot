import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { NextRequest } from 'next/server';
import { selectAgentForUser, getUserPreferences } from '../../../mastra/services/user-preferences';
import { analyzeMessage } from '../../../mastra/services/behavior-analyzer';
import { logExercise } from '../../../mastra/tools/exercise-logger';

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const userId = req.headers.get('x-user-id') || 'noam';
  const modelType = req.headers.get('x-model') || 'gemini';
  
  // Get user preferences
  const userPrefs = await getUserPreferences(userId);
  
  // Select appropriate agent
  const agentName = await selectAgentForUser(userId);
  console.log(`🤖 Using agent: ${agentName} for user: ${userId}`);
  
  // Get last user message
  const lastMessage = messages[messages.length - 1];
  const messageAnalysis = analyzeMessage(lastMessage.content);
  
  // Check if this is an exercise report
  if (messageAnalysis.isExerciseReport) {
    // Extract exercise details (simplified)
    const match = lastMessage.content.match(/(\d+)\s*(.+)/);
    if (match) {
      const count = parseInt(match[1]);
      const exercise = match[2].trim();
      await logExercise(exercise, count, userId);
    }
  }
  
  // Build system prompt based on user preferences
  let systemPrompt = '';
  
  if (userPrefs.avoidQuestions) {
    systemPrompt = `אתה SweatBot, מאמן כושר דיגיטלי בעברית.

חוקים קריטיים עבור ${userId}:
🚫 אל תשאל שאלות כלל! המשתמש לא אוהב שאלות!
✅ תן אישורים קצרים וחיוביים בלבד
💪 השתמש באמוג'ים לעידוד

דוגמאות נכונות:
- "מעולה! נרשם! 💪"
- "כל הכבוד! 🔥"

אסור לשאול על קושי, משקל, או הרגשה!`;
  } else if (userPrefs.likesEngagement) {
    systemPrompt = `אתה SweatBot, מאמן כושר מקצועי בעברית.
    
למשתמש ${userId}:
✅ שאל שאלות רלוונטיות
✅ תן פידבק מפורט
✅ הצע דרכים לשיפור`;
  } else {
    systemPrompt = `אתה SweatBot, מאמן כושר בעברית.
למד את העדפות המשתמש מהתגובות שלו.`;
  }
  
  // Stream response using appropriate model
  const model = modelType === 'gemini' 
    ? google('gemini-2.0-flash-exp')
    : google('gemini-2.0-flash-exp'); // Use Gemini for now, will add Gemma3n later
  
  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
    temperature: userPrefs.avoidQuestions ? 0.3 : 0.7,
    maxTokens: userPrefs.responseStyle === 'brief' ? 150 : 300,
  });
  
  return new Response(result.textStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}