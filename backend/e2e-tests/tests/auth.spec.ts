import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'testpassword123',
    name: 'Test User'
  };

  test('user registration', async ({ request }) => {
    const response = await request.post('/auth/register', {
      data: testUser
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('message', 'User registered successfully');
    expect(data).toHaveProperty('data');

    const { user, token } = data.data;
    expect(user).toHaveProperty('email', testUser.email);
    expect(user).toHaveProperty('name', testUser.name);
    expect(user).toHaveProperty('id');
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);
  });

  test('user login', async ({ request }) => {
    // First register a user
    const registerResponse = await request.post('/auth/register', {
      data: testUser
    });

    const registerData = await registerResponse.json();
    const { token: registerToken } = registerData.data;

    // Now try to login
    const loginResponse = await request.post('/auth/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });

    expect(loginResponse.status()).toBe(200);

    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('success', true);
    expect(loginData).toHaveProperty('message', 'Login successful');
    expect(loginData).toHaveProperty('data');

    const { user, token: loginToken } = loginData.data;
    expect(user).toHaveProperty('email', testUser.email);
    expect(user).toHaveProperty('name', testUser.name);
    expect(loginToken).toBeDefined();
    expect(loginToken).not.toBe(registerToken); // Should be a new token
  });

  test('get current user profile', async ({ request }) => {
    // Register and login first
    const registerResponse = await request.post('/auth/register', {
      data: testUser
    });

    const { token } = (await registerResponse.json()).data;

    const profileResponse = await request.get('/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(profileResponse.status()).toBe(200);

    const data = await profileResponse.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(data.data).toHaveProperty('email', testUser.email);
    expect(data.data).toHaveProperty('name', testUser.name);
  });

  test('invalid login credentials', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error', 'Invalid email or password');
  });

  test('duplicate email registration', async ({ request }) => {
    // Register user first time
    await request.post('/auth/register', {
      data: testUser
    });

    // Try to register same email again
    const response = await request.post('/auth/register', {
      data: testUser
    });

    expect(response.status()).toBe(409);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('error', 'Email already exists');
  });

  test('protected endpoint without token', async ({ request }) => {
    const response = await request.get('/auth/me');

    expect(response.status()).toBe(401);
  });

  test('protected endpoint with invalid token', async ({ request }) => {
    const response = await request.get('/auth/me', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(401);
  });
});