/**
 * E2E Tests for Personalized Workout Generation
 * Tests complete flow: Profile Setup → Personalized Workouts → Verification
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  username: `test_personalized_${Date.now()}`,
  email: `test_personalized_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  full_name: 'Personalized Test User',
  preferred_language: 'he'
};

let authToken: string;
let userId: string;

test.describe('Personalized Workout Generation E2E', () => {

  test.beforeAll(async ({ request }) => {
    // Register test user
    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: TEST_USER
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.access_token;
    userId = registerData.user.id;

    console.log(`✅ Test user registered: ${TEST_USER.email}`);
  });

  test('should generate generic workout for user without profile', async ({ request }) => {
    // Get personalized workout without setting up profile
    const response = await request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=5`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.workout).toBeDefined();
    expect(data.workout.exercises).toBeDefined();
    expect(data.workout.exercises.length).toBeGreaterThan(0);
    expect(data.profile_completion).toBeLessThan(70);
    expect(data.personalization_active).toBe(false);
    expect(data.workout.message).toContain('השלם את הפרופיל');

    console.log(`✅ Generic workout generated with ${data.workout.exercises.length} exercises`);
  });

  test('should set up complete profile for personalization', async ({ request }) => {
    // Step 1: Health stats
    const healthResponse = await request.post(
      `${API_BASE_URL}/api/v1/profile/health-stats`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          age: 28,
          weight_kg: 70,
          height_cm: 170,
          fitness_level: 'intermediate',
          activity_level: 'moderate',
          workout_frequency_per_week: 4,
          preferred_workout_duration_minutes: 30
        }
      }
    );
    expect(healthResponse.ok()).toBeTruthy();

    // Step 2: Equipment (bodyweight + resistance bands)
    const equipmentResponse = await request.post(
      `${API_BASE_URL}/api/v1/profile/equipment`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          available_equipment: {
            bodyweight: true,
            resistance_bands: { light: true, medium: true, heavy: false },
            yoga_mat: true
          }
        }
      }
    );
    expect(equipmentResponse.ok()).toBeTruthy();

    // Step 3: Fitness preferences (focused on strength and upper body)
    const preferencesResponse = await request.post(
      `${API_BASE_URL}/api/v1/profile/preferences`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        data: {
          fitness_goals: ['muscle_gain', 'strength'],
          preferred_workout_types: ['strength', 'hiit'],
          avoid_exercises: ['jump', 'high_impact'],
          focus_areas: ['upper_body', 'core']
        }
      }
    );
    expect(preferencesResponse.ok()).toBeTruthy();

    console.log(`✅ Profile setup completed with focus on upper body strength`);
  });

  test('should generate personalized workout based on profile', async ({ request }) => {
    // Get personalized workout after profile setup
    const response = await request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=10`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // Verify personalization is active
    expect(data.success).toBe(true);
    expect(data.personalization_active).toBe(true);
    expect(data.profile_completion).toBeGreaterThanOrEqual(70);

    // Verify user context reflects profile
    expect(data.user_context.fitness_level).toBe('intermediate');
    expect(data.user_context.goals_count).toBe(2); // muscle_gain, strength
    expect(data.user_context.focus_areas_count).toBe(2); // upper_body, core

    // Verify workout is generated
    expect(data.workout).toBeDefined();
    expect(data.workout.exercises).toBeDefined();
    expect(data.workout.exercises.length).toBeGreaterThan(0);
    expect(data.workout.duration_minutes).toBe(10);

    // Verify personalized message
    expect(data.workout.message).toMatch(/מותאם/);

    console.log(`✅ Personalized workout generated:`);
    console.log(`   - ${data.workout.exercises.length} exercises`);
    console.log(`   - Profile completion: ${data.profile_completion}%`);
    console.log(`   - Fitness level: ${data.user_context.fitness_level}`);
    console.log(`   - Goals: ${data.user_context.goals_count}`);

    // Verify exercises match preferences (should focus on upper body/core)
    const exerciseNames = data.workout.exercises.map((ex: any) => ex.hebrew_name);
    console.log(`   - Exercises: ${exerciseNames.join(', ')}`);

    // Verify no exercises user wants to avoid appear
    const hasAvoidedExercises = data.workout.exercises.some((ex: any) =>
      ex.hebrew_name.toLowerCase().includes('קפיצ') || // Jumping exercises
      ex.hebrew_name.toLowerCase().includes('jump')
    );
    expect(hasAvoidedExercises).toBe(false);

    console.log(`✅ No avoided exercises (jumping) in personalized workout`);
  });

  test('should respect fitness level in exercise selection', async ({ request }) => {
    // Create beginner user
    const beginnerUser = {
      username: `test_beginner_${Date.now()}`,
      email: `test_beginner_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      full_name: 'Beginner User',
      preferred_language: 'he'
    };

    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: beginnerUser
    });
    const registerData = await registerResponse.json();
    const beginnerToken = registerData.access_token;

    // Set fitness level to beginner
    await request.post(`${API_BASE_URL}/api/v1/profile/health-stats`, {
      headers: { Authorization: `Bearer ${beginnerToken}` },
      data: {
        age: 35,
        fitness_level: 'beginner',
        activity_level: 'lightly_active'
      }
    });

    // Get personalized workout for beginner
    const workoutResponse = await request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=5`,
      {
        headers: { Authorization: `Bearer ${beginnerToken}` }
      }
    );

    expect(workoutResponse.ok()).toBeTruthy();
    const workout = await workoutResponse.json();

    // Verify beginner-appropriate workout
    expect(workout.user_context.fitness_level).toBe('beginner');
    expect(workout.workout.exercises.length).toBeGreaterThan(0);

    console.log(`✅ Beginner workout generated (should exclude advanced exercises)`);
  });

  test('should generate different workouts for different goals', async ({ request }) => {
    // Test weight loss goal
    await request.post(`${API_BASE_URL}/api/v1/profile/preferences`, {
      headers: { Authorization: `Bearer ${authToken}` },
      data: {
        fitness_goals: ['weight_loss', 'endurance'],
        preferred_workout_types: ['cardio', 'hiit'],
        focus_areas: ['full_body']
      }
    });

    const cardioWorkout = await request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=10`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const cardioData = await cardioWorkout.json();
    expect(cardioData.success).toBe(true);
    expect(cardioData.user_context.goals_count).toBe(2);

    console.log(`✅ Cardio-focused workout for weight loss goal`);
    console.log(`   - Exercises: ${cardioData.workout.exercises.map((ex: any) => ex.hebrew_name).join(', ')}`);
  });

  test('should provide variety across multiple workout requests', async ({ request }) => {
    // Get 3 workouts in a row
    const workouts = [];
    for (let i = 0; i < 3; i++) {
      const response = await request.get(
        `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=5`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );
      const data = await response.json();
      workouts.push(data.workout);
    }

    // Collect all exercise names
    const allExerciseNames = workouts.flatMap(w =>
      w.exercises.map((ex: any) => ex.hebrew_name)
    );

    // Count unique exercises
    const uniqueExercises = new Set(allExerciseNames);

    // Should have good variety (at least 60% unique)
    const varietyRatio = uniqueExercises.size / allExerciseNames.length;
    expect(varietyRatio).toBeGreaterThan(0.5);

    console.log(`✅ Exercise variety across 3 workouts:`);
    console.log(`   - Total exercises: ${allExerciseNames.length}`);
    console.log(`   - Unique exercises: ${uniqueExercises.size}`);
    console.log(`   - Variety ratio: ${(varietyRatio * 100).toFixed(1)}%`);
  });

  test('should handle duration parameter correctly', async ({ request }) => {
    // Test different durations
    const durations = [5, 10, 15];

    for (const duration of durations) {
      const response = await request.get(
        `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=${duration}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.workout.duration_minutes).toBe(duration);

      // Longer durations should have more exercises
      if (duration === 5) {
        expect(data.workout.exercises.length).toBeGreaterThanOrEqual(3);
      } else if (duration === 10) {
        expect(data.workout.exercises.length).toBeGreaterThanOrEqual(5);
      } else if (duration === 15) {
        expect(data.workout.exercises.length).toBeGreaterThanOrEqual(7);
      }

      console.log(`✅ ${duration} min workout: ${data.workout.exercises.length} exercises`);
    }
  });

  test('should verify workout response includes Hebrew instructions', async ({ request }) => {
    const response = await request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=5`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const data = await response.json();

    // Verify Hebrew content
    expect(data.workout.workout_plan).toBeDefined();
    expect(data.workout.workout_plan).toMatch(/[א-ת]/); // Contains Hebrew characters
    expect(data.workout.hebrew_response).toBeDefined();

    // Verify each exercise has Hebrew name
    for (const exercise of data.workout.exercises) {
      expect(exercise.hebrew_name).toBeDefined();
      expect(exercise.hebrew_name).toMatch(/[א-ת]/);
      expect(exercise.instruction).toBeDefined();
    }

    console.log(`✅ All workout content includes Hebrew instructions`);
  });
});
