import { test, expect } from '@playwright/test';

test.describe('Health Endpoints', () => {
  test('basic health check', async ({ request }) => {
    const response = await request.get('/health');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('service', 'sweatbot-api');
    expect(data).toHaveProperty('version', '2.0.0');
    expect(data).toHaveProperty('timestamp');
  });

  test('detailed health check', async ({ request }) => {
    const response = await request.get('/health/detailed');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('components');
    expect(data.components).toHaveProperty('server');
    expect(data.components.server).toHaveProperty('status', 'healthy');
  });

  test('debug environment endpoint', async ({ request }) => {
    const response = await request.get('/debug/env');

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'debug');
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('api_keys_loaded');

    // Check AI provider keys are loaded
    const apiKeys = data.api_keys_loaded;
    expect(apiKeys).toHaveProperty('OPENAI_API_KEY');
    expect(apiKeys).toHaveProperty('GROQ_API_KEY');
    expect(apiKeys).toHaveProperty('GEMINI_API_KEY');
    expect(apiKeys).toHaveProperty('ANTHROPIC_API_KEY');
  });
});