// Quick test to debug AI response parsing issue
// Run with: node debug-ai-response.js

const fetch = require('node-fetch');

async function testBackendResponse() {
  try {
    console.log('🔍 Testing backend AI response...');

    const response = await fetch('http://localhost:8000/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        message: 'Hello, how are you?',
        provider: 'openai'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend response structure:');
      console.log(JSON.stringify(data, null, 2));

      // Test the frontend parsing logic
      console.log('\n🧪 Testing frontend parsing logic...');

      // This mimics the aiClient.ts transformation
      const transformedResponse = {
        content: data.data?.response || data.response,
        model: data.data?.model || data.model_used || 'openai-gpt-4o-mini',
        provider: data.data?.provider || 'openai',
        tool_calls: [],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: data.data?.tokens || 0
        },
        finish_reason: 'stop'
      };

      console.log('✅ Transformed response:');
      console.log('Content:', transformedResponse.content);
      console.log('Content type:', typeof transformedResponse.content);
      console.log('Content length:', transformedResponse.content ? transformedResponse.content.length : 'undefined');

      if (transformedResponse.content) {
        console.log('🎉 SUCCESS: Hebrew content should be visible!');
      } else {
        console.log('❌ FAILURE: Content is undefined - this is the root cause');
      }
    } else {
      console.error('❌ Backend request failed:', response.statusText);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBackendResponse();