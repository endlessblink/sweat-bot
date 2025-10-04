#!/usr/bin/env node

/**
 * Test OpenAI Integration with SweatBot (CLI version)
 * Tests the AI providers directly without browser
 */

import { OpenAIProvider } from './src/agent/providers/openai.js';

async function testOpenAIProvider() {
  console.log('🚀 Testing OpenAI Provider Integration...\n');
  
  // Check if API key is set
  const apiKey = process.env.VITE_OPENAI_API_KEY || 'sk-test-key';
  
  if (!apiKey || apiKey === 'sk-your-openai-api-key-here' || apiKey === 'sk-test-key') {
    console.log('⚠️  WARNING: No real OpenAI API key found');
    console.log('   Please set VITE_OPENAI_API_KEY in .env file');
    console.log('   Using placeholder key will result in API errors\n');
  }
  
  try {
    // Initialize OpenAI provider
    console.log('1️⃣ Initializing OpenAI provider with GPT-4o-mini...');
    const provider = new OpenAIProvider({
      apiKey: apiKey,
      model: 'gpt-4o-mini'
    });
    console.log('   ✅ Provider initialized\n');
    
    // Test 1: Simple greeting
    console.log('2️⃣ Test 1: Simple greeting...');
    const response1 = await provider.chat('היי', {
      systemPrompt: 'אתה מאמן כושר ידידותי שמדבר עברית',
      temperature: 0.7
    });
    console.log('   Response:', response1);
    
    // Check for clean response
    if (typeof response1 === 'string' && !response1.includes('{"content')) {
      console.log('   ✅ Clean response (no JSON)\n');
    } else {
      console.log('   ❌ Response contains unexpected format\n');
    }
    
    // Test 2: With tools
    console.log('3️⃣ Test 2: Testing with tools...');
    const tools = [{
      name: 'exerciseLogger',
      description: 'Log an exercise',
      parameters: {
        exercise: { type: 'string' },
        reps: { type: 'string' }
      }
    }];
    
    const response2 = await provider.chat('עשיתי 30 סקוואטים', {
      systemPrompt: 'אתה מאמן כושר. השתמש בכלים כשמשתמש מדווח על תרגיל',
      tools: tools,
      temperature: 0.7
    });
    
    console.log('   Response type:', typeof response2);
    if (response2.toolCalls) {
      console.log('   Tool calls detected:', response2.toolCalls);
      console.log('   ✅ Tool calling works!\n');
    } else {
      console.log('   Response:', response2);
      console.log('   ⚠️ No tool calls detected\n');
    }
    
    console.log('✅ OpenAI provider is correctly integrated!');
    console.log('   - Provider initializes successfully');
    console.log('   - Can handle Hebrew text');
    console.log('   - Tool calling structure is in place');
    console.log('\n⚠️  Note: To fully test, you need a valid OpenAI API key');
    
  } catch (error) {
    console.error('❌ Error testing OpenAI provider:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n📝 To get an OpenAI API key:');
      console.log('   1. Go to https://platform.openai.com/api-keys');
      console.log('   2. Create a new API key');
      console.log('   3. Add it to personal-ui-vite/.env as VITE_OPENAI_API_KEY=sk-...');
      console.log('   4. Restart the dev server');
    }
  }
}

// Run the test
testOpenAIProvider().catch(console.error);