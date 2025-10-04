#!/usr/bin/env node
/**
 * Test natural conversation flow without forcing tools
 */

import Groq from 'groq-sdk';

const GROQ_API_KEY = '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';

async function testConversation() {
  console.log('🧪 Testing Natural Conversation Flow\n');
  
  const client = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: false
  });
  
  const systemPrompt = `אתה SweatBot - בוט כושר אישי מומחה בעברית.
אתה מומחה בכושר, תזונה, אימונים ומוטיבציה.

כללי התנהגות:
1. ענה תמיד בעברית בלבד (אלא אם המשתמש כותב באנגלית)
2. היה ידידותי, מעודד ומקצועי
3. תן עצות מדויקות ומותאמות אישית
4. עזור במעקב אימונים, הישגים ויעדים

חשוב מאוד - שימוש בכלים:
השתמש בכלים רק כאשר המשתמש מבקש במפורש פעולות כושר כמו:
- רישום אימון או תרגיל
- בקשה לראות נקודות או סטטיסטיקות
- בקשה להצעת אימון
- הגדרת יעד כושר
- ניתוח התקדמות

אל תשתמש בכלים עבור:
- ברכות ושיחת חולין ("שלום", "מה שלומך")
- שאלות כלליות ("מה השעה", "מה מזג האוויר")
- שיחה רגילה שלא קשורה לכושר

היה חיובי ומעודד! 💪`;
  
  // Test cases
  const testMessages = [
    { input: "שלום", expected: "Greeting without tools" },
    { input: "מה השעה?", expected: "General question without tools" },
    { input: "איך אתה?", expected: "Casual chat without tools" },
    { input: "אני רוצה לרשום 20 סקוואטים", expected: "Should trigger exercise tool" },
    { input: "כמה נקודות יש לי?", expected: "Should trigger stats tool" },
    { input: "תציע לי אימון", expected: "Should trigger workout suggestion tool" }
  ];
  
  const messages = [
    { role: 'system', content: systemPrompt }
  ];
  
  for (const test of testMessages) {
    console.log(`\n📤 Testing: "${test.input}"`);
    console.log(`   Expected: ${test.expected}`);
    
    messages.push({ role: 'user', content: test.input });
    
    try {
      const completion = await client.chat.completions.create({
        messages,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 512,
      });
      
      const response = completion.choices[0].message.content || '';
      messages.push({ role: 'assistant', content: response });
      
      console.log(`   ✅ Response (${response.length} chars):`);
      console.log(`   "${response.substring(0, 150)}${response.length > 150 ? '...' : ''}"`);
      
      // Check if tools were mentioned
      const toolMentions = response.includes('tool') || response.includes('כלי');
      console.log(`   Tools mentioned: ${toolMentions ? '⚠️ Yes' : '✅ No'}`);
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n✨ Test Complete!');
}

testConversation();