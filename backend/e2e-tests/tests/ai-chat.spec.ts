import { test, expect } from '@playwright/test';

test.describe('AI Chat Integration', () => {
  let authToken: string;
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Register a test user for chat tests
    const testUser = {
      email: `chat-test-${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Chat Test User'
    };

    const registerResponse = await request.post('/auth/register', {
      data: testUser
    });

    const data = await registerResponse.json();
    authToken = data.data.token;
    userId = data.data.user.id;
  });

  test('get AI providers status', async ({ request }) => {
    const response = await request.get('/api/v1/chat/providers', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('providers');

    const providers = data.data.providers;
    expect(providers).toHaveProperty('openai');
    expect(providers).toHaveProperty('groq');
    expect(providers).toHaveProperty('anthropic');
    expect(providers).toHaveProperty('gemini');
  });

  test('send chat message to AI', async ({ request }) => {
    const chatData = {
      message: 'Hello! I want to start working out. Can you give me a beginner fitness plan?',
      provider: 'openai'
    };

    const response = await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: chatData
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');

    const { response: aiResponse, provider, model, tokens, responseTime } = data.data;
    expect(aiResponse).toBeDefined();
    expect(typeof aiResponse).toBe('string');
    expect(aiResponse.length).toBeGreaterThan(50); // Should be a meaningful response
    expect(provider).toBe('openai');
    expect(model).toBe('gpt-4o-mini');
    expect(tokens).toBeGreaterThan(0);
    expect(responseTime).toBeGreaterThan(0);

    console.log(`\n🤖 AI Response (OpenAI - ${model}):`);
    console.log(`Response Time: ${responseTime}ms`);
    console.log(`Tokens Used: ${tokens}`);
    console.log(`Response Preview: ${aiResponse.substring(0, 200)}...\n`);
  });

  test('chat with Groq provider', async ({ request }) => {
    const chatData = {
      message: 'I completed 3 sets of push-ups today. How can I progress?',
      provider: 'groq'
    };

    const response = await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: chatData
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const { response: aiResponse, provider, model } = data.data;

    expect(provider).toBe('groq');
    expect(model).toContain('llama');
    expect(aiResponse).toBeDefined();
    expect(aiResponse.length).toBeGreaterThan(50);

    console.log(`\n🤖 AI Response (Groq - ${model}):`);
    console.log(`Response Preview: ${aiResponse.substring(0, 200)}...\n`);
  });

  test('chat conversation history tracking', async ({ request }) => {
    // Send first message
    await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        message: 'My name is Test User and I prefer strength training',
        provider: 'openai'
      }
    });

    // Send second message referencing previous context
    const response = await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        message: 'Based on what I just told you, what exercises do you recommend?',
        provider: 'openai'
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const { response: aiResponse } = data.data;

    expect(aiResponse).toBeDefined();
    // Should reference that the AI remembers the user's preference
    expect(aiResponse.toLowerCase()).toMatch(/strength|exercise|recommend/);
  });

  test('conversation history retrieval', async ({ request }) => {
    // Send a few messages to build history
    await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: { message: 'I did squats today', provider: 'openai' }
    });

    await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: { message: 'How was my workout?', provider: 'openai' }
    });

    // Get conversation history
    const historyResponse = await request.get('/api/v1/chat/history', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(historyResponse.status()).toBe(200);

    const historyData = await historyResponse.json();
    expect(historyData).toHaveProperty('success', true);
    expect(historyData).toHaveProperty('data');
    expect(historyData.data).toHaveProperty('messages');
    expect(historyData.data.messages).toBeInstanceOf(Array);
    expect(historyData.data.messages.length).toBeGreaterThan(0);

    const messages = historyData.data.messages;
    // Check that both user and assistant messages are present
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');

    expect(userMessages.length).toBeGreaterThan(0);
    expect(assistantMessages.length).toBeGreaterThan(0);

    // Verify message structure
    messages.forEach(msg => {
      expect(msg).toHaveProperty('role');
      expect(msg).toHaveProperty('content');
      expect(msg).toHaveProperty('timestamp');
    });
  });

  test('AI provider fallback mechanism', async ({ request }) => {
    // This test would need to mock a provider failure
    // For now, test with a non-existent provider
    const response = await request.post('/api/v1/chat', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: {
        message: 'Test fallback mechanism',
        provider: 'nonexistent_provider'
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const { response: aiResponse, provider } = data.data;

    // Should fallback to OpenAI
    expect(provider).toBe('openai');
    expect(aiResponse).toBeDefined();
    expect(aiResponse.length).toBeGreaterThan(0);
  });

  test('AI provider health check', async ({ request }) => {
    const response = await request.get('/api/v1/chat/health', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('overall');
    expect(data.data).toHaveProperty('providers');

    const healthData = data.data;
    expect(['healthy', 'degraded', 'unhealthy']).toContain(healthData.overall);
    expect(Object.keys(healthData.providers).length).toBeGreaterThan(0);
  });

  test('test AI provider directly', async ({ request }) => {
    const testData = {
      provider: 'openai',
      message: 'Quick test message'
    };

    const response = await request.post('/api/v1/chat/test', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      data: testData
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('provider');
    expect(data.data).toHaveProperty('response');
    expect(data.data).toHaveProperty('responseTime');
    expect(data.data).toHaveProperty('tokens');
    expect(data.data).toHaveProperty('cost');

    expect(data.data.provider).toBe('openai');
    expect(data.data.response).toBeDefined();
    expect(data.data.response.length).toBeGreaterThan(0);
  });
});