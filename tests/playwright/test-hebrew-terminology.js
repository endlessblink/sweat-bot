/**
 * E2E Test: Hebrew Terminology Fixes
 * Tests that AI uses correct English names for specific exercises
 */

const { chromium } = require('playwright');

async function testHebrewTerminologyFix() {
  console.log('🧪 Starting Hebrew Terminology E2E Test...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));

  try {
    // Navigate to app
    console.log('📱 Navigating to http://localhost:8006...');
    await page.goto('http://localhost:8006', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({
      path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/test-session-2025-10-09/01-initial-load.png',
      fullPage: true
    });

    console.log('\n✅ Page loaded successfully\n');

    // Test 1: Request quick workout
    console.log('🏋️ Test 1: Requesting quick workout...');
    const input = await page.locator('textarea[placeholder*="הודעה"], input[placeholder*="הודעה"]').first();
    await input.fill('תן לי אימון קצר של 5 דקות');

    // Click send button or press Enter
    await page.keyboard.press('Enter');

    // Wait for AI response
    console.log('⏳ Waiting for AI response...');
    await page.waitForTimeout(8000); // Give AI time to respond

    // Get the response text
    const responseText = await page.locator('.chat-message, [class*="message"], [class*="Message"]').last().innerText();
    console.log('\n📝 Response 1:');
    console.log(responseText);
    console.log('\n');

    // Check for forbidden Hebrew terms
    const forbiddenTerms = ['קפיצות כוכבים', 'סיבובי רוסי', 'סיבובי גו', 'טלטולים', 'שכיבות סמיכה'];
    const requiredTerms = ['Jumping Jacks', 'Russian Twists', 'Mountain Climbers'];

    let hasErrors = false;

    forbiddenTerms.forEach(term => {
      if (responseText.includes(term)) {
        console.log(`❌ FAIL: Found forbidden Hebrew term: "${term}"`);
        hasErrors = true;
      } else {
        console.log(`✅ PASS: No forbidden term "${term}" found`);
      }
    });

    let englishTermsUsed = [];
    requiredTerms.forEach(term => {
      if (responseText.includes(term)) {
        console.log(`✅ PASS: English term "${term}" used correctly`);
        englishTermsUsed.push(term);
      }
    });

    // Take screenshot
    await page.screenshot({
      path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/test-session-2025-10-09/02-first-workout.png',
      fullPage: true
    });

    // Test 2: Request another quick workout to test variety
    console.log('\n🏋️ Test 2: Requesting second quick workout for variety check...');
    await page.waitForTimeout(2000);
    await input.fill('תן לי עוד אימון קצר של 5 דקות');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(8000);

    const responseText2 = await page.locator('.chat-message, [class*="message"], [class*="Message"]').last().innerText();
    console.log('\n📝 Response 2:');
    console.log(responseText2);
    console.log('\n');

    // Check second response for errors
    forbiddenTerms.forEach(term => {
      if (responseText2.includes(term)) {
        console.log(`❌ FAIL: Found forbidden Hebrew term: "${term}"`);
        hasErrors = true;
      } else {
        console.log(`✅ PASS: No forbidden term "${term}" found`);
      }
    });

    requiredTerms.forEach(term => {
      if (responseText2.includes(term)) {
        console.log(`✅ PASS: English term "${term}" used correctly`);
      }
    });

    // Take screenshot
    await page.screenshot({
      path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/test-session-2025-10-09/03-second-workout.png',
      fullPage: true
    });

    // Check variety (exercises should be different)
    const exercises1 = extractExercises(responseText);
    const exercises2 = extractExercises(responseText2);

    console.log('\n📊 Variety Analysis:');
    console.log(`Workout 1: ${exercises1.length} exercises`);
    console.log(`Workout 2: ${exercises2.length} exercises`);

    const commonExercises = exercises1.filter(ex => exercises2.includes(ex));
    const differentCount = Math.max(exercises1.length, exercises2.length) - commonExercises.length;

    console.log(`Different exercises: ${differentCount}/${Math.max(exercises1.length, exercises2.length)}`);

    if (differentCount >= 3) {
      console.log('✅ PASS: Good variety (3+ different exercises)');
    } else {
      console.log('⚠️  WARNING: Low variety');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    if (hasErrors) {
      console.log('❌ TEST FAILED: Found Hebrew terminology errors');
    } else {
      console.log('✅ TEST PASSED: All Hebrew terminology correct');
    }
    console.log(`English terms used: ${englishTermsUsed.join(', ') || 'None'}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({
      path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/test-session-2025-10-09/error.png'
    });
  } finally {
    console.log('\n🏁 Test complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

function extractExercises(text) {
  // Extract exercise names from Hebrew/English text
  // Look for patterns like "- exercise" or "1. exercise" or "• exercise"
  const lines = text.split('\n');
  const exercises = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.match(/^[-•*]\s+/) || trimmed.match(/^\d+\.\s+/)) {
      const exercise = trimmed.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').split(/[-:]/)[0].trim();
      if (exercise) exercises.push(exercise);
    }
  });

  return exercises;
}

// Run test
testHebrewTerminologyFix();
