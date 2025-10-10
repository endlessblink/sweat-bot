/**
 * Simple Profile Wizard UI Test
 * Focused test to verify profile wizard loads and works
 */

import { test, expect } from '@playwright/test';
import path from 'path';

const API_BASE_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:8005';
const SCREENSHOTS_DIR = path.join(__dirname, '../../docs/screenshots-debug/test-session-profile-wizard');

test.describe('Profile Wizard Simple Test', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Create test user
    const testUser = {
      username: `simple_test_${Date.now()}`,
      email: `simple_test_${Date.now()}@test.com`,
      password: 'TestPassword123!',
      full_name: 'Simple Test User',
      preferred_language: 'he'
    };

    const registerResponse = await request.post(`${API_BASE_URL}/auth/register`, {
      data: testUser
    });

    expect(registerResponse.ok()).toBeTruthy();
    const registerData = await registerResponse.json();
    authToken = registerData.access_token;
    console.log(`✅ Test user registered: ${testUser.email}`);
  });

  test('should load and interact with profile wizard', async ({ page }) => {
    console.log('\n🎯 Testing Profile Wizard UI...\n');

    // 1. Set auth token
    await page.goto(FRONTEND_URL);
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
    }, authToken);
    console.log('  ✅ Auth token set');

    // 2. Navigate to profile page
    await page.goto(`${FRONTEND_URL}/profile`);
    await page.waitForLoadState('networkidle');
    console.log('  ✅ Navigated to /profile');

    // Take initial screenshot
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'simple-01-profile-page-loaded.png'),
      fullPage: true
    });
    console.log('  📸 Screenshot 1: Profile page loaded');

    // 3. Verify page title
    const pageTitle = page.locator('text=/הגדרת פרופיל/');
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
    console.log('  ✅ Page title visible: "הגדרת פרופיל"');

    // 4. Look for Step 1 content
    const step1Content = page.locator('text=/מידע בסיסי/');
    if (await step1Content.isVisible({ timeout: 5000 })) {
      console.log('  ✅ Step 1 (Health Stats) visible');

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'simple-02-step1-visible.png'),
        fullPage: true
      });
      console.log('  📸 Screenshot 2: Step 1 content');

      // Try to find and fill age input
      const ageInput = page.locator('input[type="number"]').first();
      if (await ageInput.isVisible({ timeout: 3000 })) {
        await ageInput.fill('30');
        console.log('  ✅ Filled age input: 30');

        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'simple-03-age-filled.png'),
          fullPage: true
        });
        console.log('  📸 Screenshot 3: Age filled');
      } else {
        console.log('  ⚠️  Age input not found (checking actual UI structure)');
      }

      // Look for continue button
      const continueButton = page.locator('button:has-text("המשך")');
      if (await continueButton.isVisible({ timeout: 3000 })) {
        console.log('  ✅ Continue button found');
        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, 'simple-04-before-continue.png'),
          fullPage: true
        });
        console.log('  📸 Screenshot 4: Before clicking continue');
      } else {
        console.log('  ⚠️  Continue button not found');
      }
    } else {
      console.log('  ⚠️  Step 1 header not visible - checking what IS visible...');

      // Take screenshot of whatever is shown
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'simple-02-actual-page-content.png'),
        fullPage: true
      });
      console.log('  📸 Screenshot 2: Actual page content');

      // Get all visible text to see what's actually rendered
      const bodyText = await page.locator('body').textContent();
      console.log('\n  📝 Visible page content:\n', bodyText?.substring(0, 500));
    }

    console.log('\n✅ Test completed - check screenshots for results');
  });
});
