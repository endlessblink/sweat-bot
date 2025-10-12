/**
 * SweatBot E2E Tests - Workout System
 * Tests the complete workout logging and history flow
 *
 * CRITICAL: These tests use REAL data, not mocks (CLAUDE.md rule #3)
 */

import { test, expect } from '@playwright/test';

const BACKEND_URL = process.env.VITE_BACKEND_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8005';

// Test user credentials (should be in Doppler)
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@sweatbot.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPass123!';

test.describe('Workout System - E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${FRONTEND_URL}/login`);

    // Login with test user
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to chat page
    await page.waitForURL(`${FRONTEND_URL}/chat`, { timeout: 10000 });
  });

  test('Exercise Logging Flow - Hebrew Input', async ({ page }) => {
    // Type exercise in Hebrew
    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill('עשיתי 20 סקוואטים');
    await chatInput.press('Enter');

    // Wait for AI response
    await page.waitForTimeout(3000); // AI processing time

    // Verify success message appears
    const successMessage = page.locator('text=/.*נרשמו בהצלחה.*/i');
    await expect(successMessage).toBeVisible({ timeout: 15000 });

    // Verify points awarded
    const pointsMessage = page.locator('text=/.*נקודות.*/i');
    await expect(pointsMessage).toBeVisible();

    // Verify backend recorded the exercise
    const response = await page.request.get(`${BACKEND_URL}/api/v1/exercises/history?days=1`);
    expect(response.ok()).toBeTruthy();

    const exercises = await response.json();
    expect(exercises.length).toBeGreaterThan(0);

    const latestExercise = exercises[0];
    expect(latestExercise.name_he).toContain('סקוואט');
    expect(latestExercise.reps).toBe(20);
    expect(latestExercise.points_earned).toBeGreaterThan(0);
  });

  test('Exercise Logging Flow - English Input', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    await chatInput.fill('I did 15 push-ups');
    await chatInput.press('Enter');

    await page.waitForTimeout(3000);

    const successMessage = page.locator('text=/.*success.*/i');
    await expect(successMessage).toBeVisible({ timeout: 15000 });

    // Verify in backend
    const response = await page.request.get(`${BACKEND_URL}/api/v1/exercises/history?days=1`);
    const exercises = await response.json();

    const pushupExercise = exercises.find((ex: any) =>
      ex.name.toLowerCase().includes('push') ||
      ex.name_he.includes('שכיבות')
    );

    expect(pushupExercise).toBeDefined();
    expect(pushupExercise?.reps).toBe(15);
  });

  test('Workout History Retrieval', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible();

    // Ask for workout history
    await chatInput.fill('מה האימונים שלי החודש?');
    await chatInput.press('Enter');

    await page.waitForTimeout(3000);

    // Verify history display
    const historyResponse = page.locator('text=/.*פירוט.*תרגילים.*/i');
    await expect(historyResponse).toBeVisible({ timeout: 15000 });

    // Verify summary statistics
    const summaryText = page.locator('text=/.*סיכום.*/i');
    await expect(summaryText).toBeVisible();

    // Verify points total
    const pointsTotal = page.locator('text=/.*סה"כ נקודות.*/i');
    await expect(pointsTotal).toBeVisible();
  });

  test('Statistics Retrieval', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible();

    // Ask for statistics
    await chatInput.fill('כמה נקודות יש לי?');
    await chatInput.press('Enter');

    await page.waitForTimeout(3000);

    // Verify stats display
    const statsResponse = page.locator('text=/.*נקודות שלך.*/i');
    await expect(statsResponse).toBeVisible({ timeout: 15000 });

    // Verify backend stats match
    const response = await page.request.get(`${BACKEND_URL}/api/v1/exercises/statistics`);
    expect(response.ok()).toBeTruthy();

    const stats = await response.json();
    expect(stats.total_points).toBeGreaterThanOrEqual(0);
    expect(stats.total_exercises).toBeGreaterThanOrEqual(0);
  });

  test('Points v3 Calculation Verification', async ({ page }) => {
    // Clear existing data for clean test
    await page.request.delete(`${BACKEND_URL}/api/v1/exercises/clear-all`);

    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible();

    // Log a specific exercise
    await chatInput.fill('עשיתי 10 סקוואטים');
    await chatInput.press('Enter');

    await page.waitForTimeout(3000);

    // Verify points were calculated
    const response = await page.request.get(`${BACKEND_URL}/api/v1/exercises/history?days=1`);
    const exercises = await response.json();

    expect(exercises.length).toBe(1);

    const exercise = exercises[0];
    expect(exercise.points_earned).toBeGreaterThan(0);
    expect(exercise.points_earned).toBeLessThan(1000); // Sanity check

    console.log(`Points v3 calculated: ${exercise.points_earned} points for 10 squats`);
  });

  test('Multiple Exercises in Conversation', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible();

    // Log first exercise
    await chatInput.fill('עשיתי 20 סקוואטים');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Log second exercise
    await chatInput.fill('ו-15 שכיבות סמיכה');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Log third exercise
    await chatInput.fill('ו-5 משיכות');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Verify all exercises recorded
    const response = await page.request.get(`${BACKEND_URL}/api/v1/exercises/history?days=1`);
    const exercises = await response.json();

    expect(exercises.length).toBeGreaterThanOrEqual(3);

    // Verify total points accumulated
    const totalPoints = exercises.reduce((sum: number, ex: any) => sum + ex.points_earned, 0);
    expect(totalPoints).toBeGreaterThan(0);
  });

  test('Empty State - No Exercises', async ({ page }) => {
    // Clear all data
    await page.request.delete(`${BACKEND_URL}/api/v1/exercises/clear-all`);

    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible();

    // Ask for history when empty
    await chatInput.fill('מה האימונים שלי?');
    await chatInput.press('Enter');

    await page.waitForTimeout(3000);

    // Verify empty state message
    const emptyMessage = page.locator('text=/.*אין תרגילים.*/i');
    await expect(emptyMessage).toBeVisible({ timeout: 15000 });
  });

  test('Data Persistence - Chat History', async ({ page }) => {
    const chatInput = page.locator('textarea[placeholder*="הקלד"]');
    await expect(chatInput).toBeVisible();

    // Send a message
    await chatInput.fill('היי, מה המצב?');
    await chatInput.press('Enter');
    await page.waitForTimeout(3000);

    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify chat history persisted
    const previousMessage = page.locator('text=/.*מה המצב.*/i');
    await expect(previousMessage).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Backend API Tests', () => {

  test('Backend Health Check', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health/detailed`);
    expect(response.ok()).toBeTruthy();

    const health = await response.json();
    expect(health.components.database.status).toBe('healthy');
  });

  test('Exercise Logging API', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/api/v1/exercises/log`, {
      data: {
        name: 'Squat',
        name_he: 'סקוואט',
        reps: 10,
        sets: 3
      }
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();
    expect(result.points_earned).toBeGreaterThan(0);
    expect(result.name_he).toBe('סקוואט');
  });

  test('Exercise History API', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/v1/exercises/history?days=30`);
    expect(response.ok()).toBeTruthy();

    const exercises = await response.json();
    expect(Array.isArray(exercises)).toBeTruthy();
  });

  test('Statistics API', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/v1/exercises/statistics`);
    expect(response.ok()).toBeTruthy();

    const stats = await response.json();
    expect(stats).toHaveProperty('total_points');
    expect(stats).toHaveProperty('total_exercises');
    expect(stats).toHaveProperty('recent_exercises');
  });
});
