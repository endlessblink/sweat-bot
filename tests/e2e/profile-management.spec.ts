/**
 * E2E Tests for Profile Management API
 * Tests all profile endpoints with authentication and validation
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  username: `test_profile_${Date.now()}`,
  email: `test_profile_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  full_name: 'Test User',
  preferred_language: 'he'
};

let authToken: string;
let userId: string;

test.describe('Profile Management API', () => {

  test.beforeAll(async ({ request }) => {
    // Register a test user
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: TEST_USER
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.access_token;
    userId = registerData.user.id;

    console.log(`✅ Test user registered: ${TEST_USER.email}`);
  });

  test('should get initial profile completion status', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/profile/completion-status`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('profile_completion_percentage');
    expect(data).toHaveProperty('onboarding_completed');
    expect(data).toHaveProperty('missing_fields');
    expect(data).toHaveProperty('total_fields');
    expect(data).toHaveProperty('completed_fields');

    // Initially, profile may have 10% from preferred_language set during registration
    expect(data.profile_completion_percentage).toBeGreaterThanOrEqual(0);
    expect(data.profile_completion_percentage).toBeLessThanOrEqual(20); // Could have full_name too
    expect(data.onboarding_completed).toBe(false);

    console.log(`✅ Initial profile completion: ${data.profile_completion_percentage}%`);
  });

  test('should update health stats', async ({ request }) => {
    const healthStats = {
      age: 30,
      weight_kg: 75.0,
      height_cm: 175.0,
      body_fat_percentage: 15.0,
      resting_heart_rate: 60,
      fitness_level: 'intermediate',
      activity_level: 'moderate',
      workout_frequency_per_week: 4,
      preferred_workout_duration_minutes: 45
    };

    const response = await request.post(
      `${API_BASE_URL}/api/v1/profile/health-stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: healthStats
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.profile_completion_percentage).toBeGreaterThan(0);
    expect(data.updated_fields.length).toBeGreaterThan(0);

    // Should now have at least 70 points (7 fields x 10 points each)
    expect(data.profile_completion_percentage).toBeGreaterThanOrEqual(70);

    console.log(`✅ Health stats updated. Completion: ${data.profile_completion_percentage}%`);
  });

  test('should update medical information', async ({ request }) => {
    const medicalInfo = {
      medical_conditions: ['none'],
      injuries: []
    };

    const response = await request.post(
      `${API_BASE_URL}/api/v1/profile/medical-info`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: medicalInfo
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.updated_fields).toContain('medical_conditions');

    console.log(`✅ Medical info updated`);
  });

  test('should update equipment inventory', async ({ request }) => {
    const equipment = {
      available_equipment: {
        bodyweight: true,
        resistance_bands: { light: true, medium: false, heavy: false },
        yoga_mat: true,
        pull_up_bar: false
      },
      equipment_preferences: {
        preferred_types: ['bodyweight', 'resistance_bands'],
        avoid_equipment: [],
        min_space_required: '2x2 meters'
      }
    };

    const response = await request.post(
      `${API_BASE_URL}/api/v1/profile/equipment`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: equipment
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.updated_fields).toContain('available_equipment');
    // Equipment adds 10 points, so total should be at least 20 (initial 10 + equipment 10)
    expect(data.profile_completion_percentage).toBeGreaterThanOrEqual(20);

    console.log(`✅ Equipment inventory updated. Completion: ${data.profile_completion_percentage}%`);
  });

  test('should update fitness preferences and complete onboarding', async ({ request }) => {
    const preferences = {
      fitness_goals: ['weight_loss', 'muscle_gain', 'endurance'],
      preferred_workout_types: ['hiit', 'strength', 'cardio'],
      avoid_exercises: [],
      focus_areas: ['upper_body', 'core'],
      time_constraints: {
        max_workout_duration: 45,
        preferred_times: ['morning', 'evening'],
        days_available: ['monday', 'wednesday', 'friday', 'sunday']
      }
    };

    const response = await request.post(
      `${API_BASE_URL}/api/v1/profile/preferences`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: preferences
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    // Adding goals (10) + workout types (10) should increase completion
    expect(data.profile_completion_percentage).toBeGreaterThanOrEqual(30);
    expect(data.updated_fields.length).toBeGreaterThan(0);

    console.log(`✅ Fitness preferences updated. Completion: ${data.profile_completion_percentage}%`);
  });

  test('should verify profile completion status after updates', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/profile/completion-status`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // After previous tests (health stats, medical, equipment, preferences),
    // the shared user should have increased completion percentage
    expect(data.profile_completion_percentage).toBeGreaterThanOrEqual(70);
    // Onboarding completes at 70% or higher
    expect(data.onboarding_completed).toBe(true);

    console.log(`✅ Profile completion: ${data.profile_completion_percentage}%! Onboarding: ${data.onboarding_completed}`);
  });

  test('should get complete profile', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/profile/complete`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify basic profile structure is present
    expect(data.user_id).toBeDefined();
    expect(data.email).toBe(TEST_USER.email);
    expect(data).toHaveProperty('profile_completion_percentage');
    expect(data).toHaveProperty('onboarding_completed');

    // Verify fields updated in previous tests exist
    expect(data.age).toBe(30);
    expect(data.weight_kg).toBe(75.0);
    expect(data.fitness_level).toBe('intermediate');
    expect(data.fitness_goals).toContain('weight_loss');
    expect(data.available_equipment).toHaveProperty('bodyweight');

    console.log(`✅ Complete profile retrieved with completion: ${data.profile_completion_percentage}%`);
  });

  test('should validate fitness_level enum', async ({ request }) => {
    const invalidData = {
      fitness_level: 'invalid_level'
    };

    const response = await request.post(
      `${API_BASE_URL}/api/v1/profile/health-stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: invalidData
      }
    );

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(422); // Validation error

    const error = await response.json();
    expect(error.detail[0].msg).toContain('fitness_level must be beginner, intermediate, or advanced');

    console.log(`✅ Validation correctly rejects invalid fitness_level`);
  });

  test('should validate age range', async ({ request }) => {
    const invalidData = {
      age: 200 // Invalid age
    };

    const response = await request.post(
      `${API_BASE_URL}/api/v1/profile/health-stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: invalidData
      }
    );

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(422);

    console.log(`✅ Validation correctly rejects age > 120`);
  });

  test('should require authentication', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/api/v1/profile/complete`
      // No Authorization header
    );

    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized

    console.log(`✅ Profile endpoints correctly require authentication`);
  });

  test('should update profile completion percentage correctly', async ({ request }) => {
    // Create a new user for this test
    const timestamp = Date.now();
    const newUser = {
      username: `test_completion_${timestamp}`,
      email: `test_completion_${timestamp}@example.com`,
      password: 'TestPassword123!',
      full_name: 'Completion Test',
      preferred_language: 'he'
    };

    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: newUser
    });
    const registerData = await registerResponse.json();
    const newToken = registerData.access_token;

    // Add fields progressively and verify completion increases

    // Step 1: Add basic info (30 points)
    await request.post(`${API_BASE_URL}/api/v1/profile/health-stats`, {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { age: 25, weight_kg: 70, height_cm: 170 }
    });

    let status = await request.get(`${API_BASE_URL}/api/v1/profile/completion-status`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    let statusData = await status.json();
    expect(statusData.profile_completion_percentage).toBe(30);

    // Step 2: Add fitness level (40 points total)
    await request.post(`${API_BASE_URL}/api/v1/profile/health-stats`, {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { fitness_level: 'beginner' }
    });

    status = await request.get(`${API_BASE_URL}/api/v1/profile/completion-status`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    statusData = await status.json();
    expect(statusData.profile_completion_percentage).toBe(40);

    // Step 3: Add activity level (50 points)
    await request.post(`${API_BASE_URL}/api/v1/profile/health-stats`, {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { activity_level: 'moderate' }
    });

    status = await request.get(`${API_BASE_URL}/api/v1/profile/completion-status`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    statusData = await status.json();
    expect(statusData.profile_completion_percentage).toBe(50);

    // Step 4: Add workout frequency (60 points)
    await request.post(`${API_BASE_URL}/api/v1/profile/health-stats`, {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { workout_frequency_per_week: 3 }
    });

    status = await request.get(`${API_BASE_URL}/api/v1/profile/completion-status`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    statusData = await status.json();
    expect(statusData.profile_completion_percentage).toBe(60);

    // Step 5: Add goals (70 points - should complete onboarding)
    await request.post(`${API_BASE_URL}/api/v1/profile/preferences`, {
      headers: { Authorization: `Bearer ${newToken}` },
      data: { fitness_goals: ['strength', 'endurance'] }
    });

    status = await request.get(`${API_BASE_URL}/api/v1/profile/completion-status`, {
      headers: { Authorization: `Bearer ${newToken}` }
    });
    statusData = await status.json();
    expect(statusData.profile_completion_percentage).toBe(70);
    expect(statusData.onboarding_completed).toBe(true); // Should auto-complete at 70%

    console.log(`✅ Profile completion percentage calculated correctly at each step`);
  });
});
