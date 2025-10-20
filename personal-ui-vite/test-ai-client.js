// Direct test of aiClient transformation logic
// This bypasses Vite module caching to test the actual issue

const { aiClient } = require('./src/services/aiClient.ts');

async function testAIClient() {
  console.log('=== TESTING AI CLIENT TRANSFORMATION ===');

  try {
    // Simulate the exact request that's failing
    const testRequest = {
      messages: [
        { role: 'user', content: 'בוקר טוב' }
      ],
      model: 'openai',
      temperature: 0.7
    };

    console.log('Test request:', JSON.stringify(testRequest, null, 2));

    // Call aiClient directly
    const response = await aiClient.chat(testRequest);

    console.log('✅ SUCCESS - aiClient response:');
    console.log('Content:', response.content);
    console.log('Type:', typeof response.content);
    console.log('Length:', response.content ? response.content.length : 'undefined');

  } catch (error) {
    console.error('❌ ERROR - aiClient failed:');
    console.error('Error:', error);
    console.error('Type:', error.constructor.name);
    console.error('Message:', error.message);
  }
}

// Test the backend directly
async function testBackend() {
  console.log('\n=== TESTING BACKEND DIRECTLY ===');

  try {
    const response = await fetch('http://localhost:8000/api/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        message: 'בוקר טוב',
        model: 'openai-gpt-4o-mini',
        context: {},
        session_id: 'test-session'
      })
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response OK:', response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend response data:');
      console.log(JSON.stringify(data, null, 2));

      // Test the transformation logic directly
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

      console.log('\n🔍 TRANSFORMATION TEST:');
      console.log('Transformed content:', transformedResponse.content);
      console.log('Transformed type:', typeof transformedResponse.content);
      console.log('Transformed length:', transformedResponse.content ? transformedResponse.content.length : 'undefined');

    } else {
      const errorText = await response.text();
      console.error('❌ Backend error:', errorText);
    }

  } catch (error) {
    console.error('❌ Backend test failed:', error);
  }
}

async function runTests() {
  await testBackend();
  await testAIClient();
}

runTests().catch(console.error);