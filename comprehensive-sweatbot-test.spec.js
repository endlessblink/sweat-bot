// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('SweatBot Comprehensive E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging to see what's happening
    page.on('console', msg => {
      console.log(`📱 Browser Console [${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.error(`🚨 Page Error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.log(`❌ Failed request: ${request.url()} - ${request.failure()?.errorText}`);
    });
  });

  test('Complete user flow test', async ({ page }) => {
    console.log('🚀 Starting comprehensive SweatBot test...');

    // Step 1: Navigate to the application
    console.log('📍 Step 1: Navigating to SweatBot...');
    try {
      await page.goto('http://localhost:8005', {
        waitUntil: 'networkidle',
        timeout: 10000
      });
      console.log('✅ Page loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load page:', error.message);
      throw error;
    }

    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);

    // Step 2: Check if the page actually has content
    console.log('🔍 Step 2: Analyzing page content...');

    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);

    // Check if we have any meaningful content
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Body text preview: "${bodyText?.substring(0, 200)}..."`);

    // Look for key elements
    const sweatbotBranding = await page.locator('text=/SweatBot|סוויטבוט/i').first();
    const isBrandingVisible = await sweatbotBranding.isVisible();
    console.log(`🏷️  SweatBot branding visible: ${isBrandingVisible}`);

    // Step 3: Look for interactive elements
    console.log('🎯 Step 3: Finding interactive elements...');

    // Look for input fields
    const inputs = await page.locator('input, textarea').count();
    console.log(`📥 Found ${inputs} input fields`);

    // Look for buttons
    const buttons = await page.locator('button').count();
    console.log(`🔘 Found ${buttons} buttons`);

    // Look for any forms
    const forms = await page.locator('form').count();
    console.log(`📋 Found ${forms} forms`);

    // Step 4: Try to interact with the application
    console.log('🤝 Step 4: Attempting user interactions...');

    if (inputs > 0) {
      // Try the first input field
      const firstInput = await page.locator('input, textarea').first();

      // Clear any existing content and type Hebrew text
      await firstInput.fill('');
      await firstInput.type('שלום, אני רוצה להתאמן');
      console.log('✅ Successfully typed Hebrew text into input');

      // Check if the text was actually entered
      const inputValue = await firstInput.inputValue();
      console.log(`📥 Input value: "${inputValue}"`);

      if (buttons > 0) {
        // Try clicking the first button (likely a send button)
        const firstButton = await page.locator('button').first();
        const buttonText = await firstButton.textContent();
        console.log(`🔘 Found button with text: "${buttonText}"`);

        await firstButton.click();
        console.log('✅ Clicked button');

        // Wait for any response
        await page.waitForTimeout(3000);

        // Look for any new content or responses
        const newBodyText = await page.locator('body').textContent();
        if (newBodyText !== bodyText) {
          console.log('✅ Page content changed after button click');
        } else {
          console.log('⚠️  No change detected after button click');
        }
      }
    } else {
      console.log('⚠️  No input fields found to interact with');
    }

    // Step 5: Check for error messages or loading states
    console.log('🔍 Step 5: Checking for errors or loading states...');

    const errorElements = await page.locator('text=/error|שגיאה|failed|נכשל/i').count();
    if (errorElements > 0) {
      console.log(`⚠️  Found ${errorElements} potential error messages`);
    }

    const loadingElements = await page.locator('text=/loading|טוען|ממתין/i').count();
    if (loadingElements > 0) {
      console.log(`ℹ️  Found ${loadingElements} loading indicators`);
    }

    // Step 6: Take a screenshot for debugging
    console.log('📸 Step 6: Taking screenshot for analysis...');
    await page.screenshot({
      path: '/tmp/sweatbot-detailed-test.png',
      fullPage: true
    });
    console.log('📸 Screenshot saved to /tmp/sweatbot-detailed-test.png');

    // Step 7: Final analysis
    console.log('📊 Step 7: Final application analysis...');

    // Check network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      });
    });

    // Wait a bit more to capture any delayed network activity
    await page.waitForTimeout(2000);

    if (requests.length > 0) {
      console.log(`🌐 Captured ${requests.length} network requests`);
      requests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
      });
    } else {
      console.log('⚠️  No network requests captured');
    }

    console.log('🏁 Comprehensive test completed');
  });

  test('API connectivity test', async ({ page }) => {
    console.log('🔌 Testing API connectivity...');

    // Test backend health endpoint
    try {
      const response = await page.goto('http://localhost:8000/health/detailed');
      const text = await page.textContent('body');
      console.log(`📊 Backend health: ${text}`);
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
    }
  });
});