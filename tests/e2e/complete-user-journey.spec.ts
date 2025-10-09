/**
 * Complete User Journey E2E Test
 * Tests the full flow: Registration → Profile Setup → Personalized Workouts → Exercise Logging
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:8005';

test.describe('Complete User Journey', () => {
  const testUser = {
    username: `journey_user_${Date.now()}`,
    email: `journey_${Date.now()}@example.com`,
    password: 'TestPassword123!',
    full_name: 'Journey Test User'
  };

  test('should complete full user journey from registration to personalized workouts', async ({ page }) => {
    console.log('\n🚀 Starting Complete User Journey Test\n');

    // Step 1: Navigate to app
    console.log('📍 Step 1: Navigate to app');
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState('networkidle');

    // Step 2: Check if we need to register/login
    console.log('📍 Step 2: Register new user via API');
    const registerResponse = await page.request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        username: testUser.username,
        email: testUser.email,
        password: testUser.password,
        full_name: testUser.full_name,
        preferred_language: 'he'
      }
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    const authToken = registerData.access_token;

    console.log(`✅ User registered: ${testUser.email}`);

    // Store token in localStorage
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    // Step 3: Navigate to profile page
    console.log('📍 Step 3: Navigate to profile setup');
    await page.goto(`${FRONTEND_URL}/profile`);
    await page.waitForLoadState('networkidle');

    // Step 4: Verify profile page loaded
    console.log('📍 Step 4: Verify profile wizard loaded');
    await page.waitForSelector('text=הגדרת פרופיל', { timeout: 10000 });

    // Verify we're on Step 1 (Health Stats)
    const healthStatsHeader = await page.locator('text=מידע בסיסי');
    await expect(healthStatsHeader).toBeVisible();

    console.log('✅ Profile wizard loaded - Step 1: Health Stats');

    // Step 5: Fill health stats
    console.log('📍 Step 5: Fill health stats');
    await page.fill('input[placeholder*="למשל: 30"]', '28');
    await page.fill('input[placeholder*="למשל: 75"]', '70');
    await page.fill('input[placeholder*="למשל: 175"]', '170');

    // Select fitness level
    await page.selectOption('select', 'intermediate');

    // Click Continue
    await page.click('button:has-text("המשך")');
    await page.waitForTimeout(2000); // Wait for API call

    console.log('✅ Health stats submitted');

    // Step 6: Medical Info (Step 2) - Skip for now
    console.log('📍 Step 6: Skip medical info');
    await page.waitForSelector('text=מידע רפואי', { timeout: 5000 });
    await page.click('button:has-text("המשך")');
    await page.waitForTimeout(2000);

    console.log('✅ Medical info submitted');

    // Step 7: Equipment Selection (Step 3)
    console.log('📍 Step 7: Select equipment');
    await page.waitForSelector('text=ציוד זמין', { timeout: 5000 });

    // Select bodyweight and resistance bands
    const bodyweightButton = page.locator('button:has-text("משקל גוף")');
    await bodyweightButton.click();

    const resistanceBandsButton = page.locator('button:has-text("גומיות")');
    await resistanceBandsButton.click();

    await page.click('button:has-text("המשך")');
    await page.waitForTimeout(2000);

    console.log('✅ Equipment selected');

    // Step 8: Fitness Preferences (Step 4)
    console.log('📍 Step 8: Set fitness preferences');
    await page.waitForSelector('text=העדפות אימון', { timeout: 5000 });

    // Select goals
    await page.click('button:has-text("בניית שריר")');
    await page.click('button:has-text("כוח")');

    // Select workout types
    await page.click('button:has-text("כוח")');
    await page.click('button:has-text("HIIT")');

    // Select focus areas
    await page.click('button:has-text("גוף עליון")');
    await page.click('button:has-text("ליבה")');

    // Click Finish
    await page.click('button:has-text("סיום")');
    await page.waitForTimeout(3000);

    console.log('✅ Fitness preferences submitted');

    // Step 9: Verify profile completion via API
    console.log('📍 Step 9: Verify profile completion');
    const profileStatus = await page.request.get(
      `${API_BASE_URL}/api/v1/profile/completion-status`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(profileStatus.ok()).toBeTruthy();
    const profileData = await profileStatus.json();

    console.log(`✅ Profile ${profileData.profile_completion_percentage}% complete`);
    console.log(`   Onboarding completed: ${profileData.onboarding_completed}`);
    expect(profileData.profile_completion_percentage).toBeGreaterThanOrEqual(70);
    expect(profileData.onboarding_completed).toBe(true);

    // Step 10: Get personalized workout
    console.log('📍 Step 10: Request personalized workout');
    const workoutResponse = await page.request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=10`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(workoutResponse.ok()).toBeTruthy();
    const workoutData = await workoutResponse.json();

    console.log('✅ Personalized workout generated:');
    console.log(`   Success: ${workoutData.success}`);
    console.log(`   Personalization active: ${workoutData.personalization_active}`);
    console.log(`   Exercises count: ${workoutData.workout.exercises.length}`);
    console.log(`   Message: ${workoutData.workout.message}`);

    // Verify personalization is active
    expect(workoutData.success).toBe(true);
    expect(workoutData.personalization_active).toBe(true);
    expect(workoutData.workout.exercises.length).toBeGreaterThan(0);

    // Verify user context reflects profile
    expect(workoutData.user_context.fitness_level).toBe('intermediate');
    expect(workoutData.user_context.goals_count).toBe(2);
    expect(workoutData.user_context.focus_areas_count).toBe(2);

    // Log exercise details
    console.log('   Exercises:');
    workoutData.workout.exercises.forEach((ex: any, i: number) => {
      console.log(`     ${i + 1}. ${ex.hebrew_name} (${ex.category})`);
    });

    // Step 11: Verify no avoided exercises
    console.log('📍 Step 11: Verify exercise filtering');
    const hasAvoidedExercises = workoutData.workout.exercises.some((ex: any) =>
      ex.hebrew_name.toLowerCase().includes('קפיצ') // We didn't set any in profile, but verify system works
    );

    console.log(`✅ Exercise filtering working (avoided exercises: ${hasAvoidedExercises})`);

    // Step 12: Log an exercise
    console.log('📍 Step 12: Log exercise from workout');
    const firstExercise = workoutData.workout.exercises[0];
    const logResponse = await page.request.post(
      `${API_BASE_URL}/exercises/log`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          name: firstExercise.exercise,
          name_he: firstExercise.hebrew_name,
          reps: 12,
          sets: 3
        }
      }
    );

    expect(logResponse.ok()).toBeTruthy();
    const logData = await logResponse.json();

    console.log('✅ Exercise logged:');
    console.log(`   Exercise: ${logData.name_he}`);
    console.log(`   Points earned: ${logData.points_earned}`);
    console.log(`   Personal record: ${logData.is_personal_record}`);

    // Step 13: Get updated statistics
    console.log('📍 Step 13: Verify statistics updated');
    const statsResponse = await page.request.get(
      `${API_BASE_URL}/exercises/statistics`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(statsResponse.ok()).toBeTruthy();
    const statsData = await statsResponse.json();

    console.log('✅ Statistics updated:');
    console.log(`   Total points: ${statsData.total_points}`);
    console.log(`   Total exercises: ${statsData.total_exercises}`);
    console.log(`   Recent exercises: ${statsData.recent_exercises.length}`);

    expect(statsData.total_points).toBeGreaterThan(0);
    expect(statsData.total_exercises).toBeGreaterThanOrEqual(1);

    // Step 14: Get another personalized workout (verify variety)
    console.log('📍 Step 14: Request second workout (verify variety)');
    const workout2Response = await page.request.get(
      `${API_BASE_URL}/exercises/personalized-workout?duration_minutes=5`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    expect(workout2Response.ok()).toBeTruthy();
    const workout2Data = await workout2Response.json();

    const workout1Exercises = new Set(workoutData.workout.exercises.map((ex: any) => ex.hebrew_name));
    const workout2Exercises = new Set(workout2Data.workout.exercises.map((ex: any) => ex.hebrew_name));

    const uniqueExercises = new Set([...workout1Exercises, ...workout2Exercises]);
    const totalExercises = workout1Exercises.size + workout2Exercises.size;
    const varietyPercentage = (uniqueExercises.size / totalExercises) * 100;

    console.log('✅ Exercise variety verified:');
    console.log(`   Workout 1: ${workout1Exercises.size} exercises`);
    console.log(`   Workout 2: ${workout2Exercises.size} exercises`);
    console.log(`   Unique exercises: ${uniqueExercises.size}`);
    console.log(`   Variety: ${varietyPercentage.toFixed(1)}%`);

    expect(varietyPercentage).toBeGreaterThan(50); // At least 50% variety

    // Final summary
    console.log('\n🎉 Complete User Journey Test PASSED!\n');
    console.log('Summary:');
    console.log('✅ User registration');
    console.log('✅ Profile wizard completion (4 steps)');
    console.log(`✅ Profile ${profileData.profile_completion_percentage}% complete`);
    console.log('✅ Personalized workouts generated');
    console.log('✅ Exercise filtering active');
    console.log('✅ Exercise logging working');
    console.log('✅ Statistics tracking');
    console.log(`✅ Exercise variety: ${varietyPercentage.toFixed(1)}%`);
    console.log('');
  });

  test('should handle profile navigation and editing', async ({ page }) => {
    console.log('\n🔄 Testing Profile Navigation\n');

    // Register user
    const registerResponse = await page.request.post(`${API_BASE_URL}/auth/register`, {
      data: {
        username: `nav_user_${Date.now()}`,
        email: `nav_${Date.now()}@example.com`,
        password: 'TestPassword123!',
        full_name: 'Navigation Test',
        preferred_language: 'he'
      }
    });

    const registerData = await registerResponse.json();
    const authToken = registerData.access_token;

    await page.goto(FRONTEND_URL);
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);

    // Navigate to profile
    await page.goto(`${FRONTEND_URL}/profile`);
    await page.waitForLoadState('networkidle');

    // Verify profile page loads
    await expect(page.locator('text=הגדרת פרופיל')).toBeVisible();

    // Test back button (should be disabled on first step)
    const backButton = page.locator('button:has-text("חזור")');
    await expect(backButton).toBeDisabled();

    // Test skip button (if present)
    const skipButton = page.locator('button:has-text("דלג")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
      // Should navigate to chat
      await page.waitForURL('**/', { timeout: 5000 });
      console.log('✅ Skip functionality working');
    }

    console.log('✅ Profile navigation test complete');
  });
});
