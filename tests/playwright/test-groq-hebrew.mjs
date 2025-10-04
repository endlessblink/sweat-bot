#!/usr/bin/env node
/**
 * Test script for Groq Hebrew responses
 */

import Groq from 'groq-sdk';

const GROQ_API_KEY = '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';

async function testGroqHebrew() {
  console.log('🧪 Testing Groq Hebrew Response...\n');
  
  try {
    const client = new Groq({
      apiKey: GROQ_API_KEY,
      dangerouslyAllowBrowser: false // We're in Node
    });
    
    const systemPrompt = `אתה SweatBot - בוט כושר אישי מומחה בעברית.
ענה תמיד בעברית בלבד.
היה ידידותי ומעודד.`;
    
    const userMessage = 'שלום, איך אני יכול להתחיל להתאמן?';
    
    console.log('📤 Sending prompt:', userMessage);
    
    const chatCompletion = await client.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });
    
    const content = chatCompletion.choices[0].message.content || '';
    
    console.log('\n✅ Response received!');
    console.log('📝 Length:', content.length, 'characters');
    console.log('💬 Content:\n', content);
    
    if (content.length <= 2) {
      console.error('\n❌ ERROR: Response too short! Got:', JSON.stringify(content));
      console.log('Full response:', chatCompletion.choices[0]);
    } else {
      console.log('\n✨ Success! Hebrew response working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testGroqHebrew();
