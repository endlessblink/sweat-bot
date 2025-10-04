#!/usr/bin/env node

import OpenAI from 'openai';

const apiKey = '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';

console.log('Testing OpenAI API directly...\n');
console.log('API Key length:', apiKey.length);
console.log('API Key prefix:', apiKey.substring(0, 20) + '...');

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: false // We're in Node.js
});

async function testAPI() {
  try {
    console.log('\nSending test message to GPT-4o-mini...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Reply in Hebrew.' },
        { role: 'user', content: 'Say hello in Hebrew in 5 words or less' }
      ],
      temperature: 0.7,
      max_tokens: 50
    });
    
    console.log('✅ Success! Response:', response.choices[0].message.content);
    console.log('\nAPI Key is valid and working!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.status === 401) {
      console.log('\n⚠️ API Key is invalid or expired');
      console.log('Please get a new key from https://platform.openai.com/api-keys');
    } else if (error.status === 429) {
      console.log('\n⚠️ Rate limit exceeded or quota issue');
    } else {
      console.log('\nFull error:', error);
    }
  }
}

testAPI();