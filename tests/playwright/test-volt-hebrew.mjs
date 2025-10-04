#!/usr/bin/env node
/**
 * Test script for Volt Agent Hebrew responses
 * Tests the fixed async text() extraction
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyDCi5mgAxIN-NCNtQnJC2oQ_6iTCvGlGIo';

async function testGeminiHebrew() {
  console.log('🧪 Testing Gemini Hebrew Response...\n');
  
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    const systemPrompt = `אתה SweatBot - בוט כושר אישי מומחה בעברית.
ענה תמיד בעברית בלבד.
היה ידידותי ומעודד.`;
    
    const userMessage = 'שלום, איך אני יכול להתחיל להתאמן?';
    const fullPrompt = `${systemPrompt}\n\nUser: ${userMessage}\nAssistant:`;
    
    console.log('📤 Sending prompt:', userMessage);
    
    const result = await model.generateContent({
      contents: [{ 
        role: 'user', 
        parts: [{ text: fullPrompt }] 
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      }
    });
    
    const response = await result.response;
    
    // CRITICAL: Must await text()!
    const text = await response.text();
    
    console.log('\n✅ Response received!');
    console.log('📝 Length:', text.length, 'characters');
    console.log('💬 Content:\n', text);
    
    if (text.length <= 2) {
      console.error('\n❌ ERROR: Response too short! Got:', JSON.stringify(text));
      console.log('Full response object:', response);
    } else {
      console.log('\n✨ Success! Hebrew response working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testGeminiHebrew();
