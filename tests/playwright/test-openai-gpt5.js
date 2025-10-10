/**
 * Quick Test: OpenAI GPT-5 with Hebrew Terminology
 * Tests that GPT-5 (primary provider) works and uses correct terminology
 */

const { chromium } = require('playwright');

async function testOpenAIGPT5() {
  console.log('🧪 Testing OpenAI GPT-5 Primary Provider...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('OpenAI') || text.includes('GPT') || text.includes('provider')) {
      console.log(`[BROWSER]: ${text}`);
    }
  });

  try {
    // Navigate to app
    console.log('📱 Navigating to http://localhost:8006...');
    await page.goto('http://localhost:8006', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    console.log('✅ Page loaded\n');

    // Send quick workout request
    console.log('🏋️ Requesting quick workout...');
    const input = await page.locator('textarea[placeholder*="הודעה"], input[placeholder*="הודעה"]').first();
    await input.fill('תן לי אימון קצר של 5 דקות');
    await page.keyboard.press('Enter');

    // Wait for response
    console.log('⏳ Waiting for AI response...\n');
    await page.waitForTimeout(10000);

    // Get the response
    const messages = await page.locator('.chat-message, [class*="message"], [class*="Message"]').all();
    const lastMessage = messages[messages.length - 1];
    const responseText = await lastMessage.innerText();

    console.log('📝 AI Response:');
    console.log(responseText);
    console.log('\n');

    // Check terminology
    const hasJumpingJacks = responseText.includes('Jumping Jacks');
    const hasMountainClimbers = responseText.includes('Mountain Climbers');
    const hasRussianTwists = responseText.includes('Russian Twists');

    const hasBadHebrew = responseText.includes('קפיצות כוכבים') ||
                         responseText.includes('טלטולים') ||
                         responseText.includes('סיבובי רוסי') ||
                         responseText.includes('סיבובי גו');

    console.log('=' + '='.repeat(59));
    console.log('📊 RESULTS');
    console.log('=' + '='.repeat(59));

    if (hasJumpingJacks) console.log('✅ Using "Jumping Jacks" in English');
    if (hasMountainClimbers) console.log('✅ Using "Mountain Climbers" in English');
    if (hasRussianTwists) console.log('✅ Using "Russian Twists" in English');

    if (hasBadHebrew) {
      console.log('❌ FAIL: Found forbidden Hebrew terminology!');
    } else {
      console.log('✅ PASS: No forbidden Hebrew terms');
    }

    console.log('=' + '='.repeat(59) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('🏁 Test complete. Browser will close in 3 seconds...');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testOpenAIGPT5();
