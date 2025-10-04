#!/usr/bin/env node

/**
 * Test OpenAI Integration with SweatBot
 * Tests the complete flow with GPT-4o-mini
 */

const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testOpenAIIntegration() {
  console.log('🚀 Starting OpenAI Integration Test...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new', // Use new headless mode
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();
    
    // Add console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('OpenAI') || text.includes('GPT') || text.includes('provider') || text.includes('Tool')) {
        console.log(`📝 Console: ${text}`);
      }
    });

    // Navigate to the app
    console.log('1️⃣ Navigating to http://localhost:8005...');
    await page.goto('http://localhost:8005', { waitUntil: 'networkidle2' });
    await delay(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-1-initial-openai.png' });
    console.log('   ✅ Page loaded, screenshot saved: test-1-initial-openai.png\n');

    // Test 1: Greeting (היי)
    console.log('2️⃣ Test 1: Sending greeting "היי"...');
    const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
    await page.waitForSelector(inputSelector);
    await page.type(inputSelector, 'היי');
    await delay(500);
    
    // Press Enter to send
    await page.keyboard.press('Enter');
    console.log('   Message sent, waiting for response...');
    await delay(3000);
    
    // Take screenshot after first message
    await page.screenshot({ path: 'test-2-greeting-openai.png' });
    
    // Get response text
    const messages1 = await page.evaluate(() => {
      const msgs = document.querySelectorAll('[class*="message"], [class*="bubble"], [class*="text"]');
      return Array.from(msgs).map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    const lastResponse1 = messages1[messages1.length - 1];
    console.log(`   Response: "${lastResponse1}"`);
    
    // Check for JSON contamination
    if (lastResponse1?.includes('{"content') || lastResponse1?.includes('function=')) {
      console.log('   ❌ ERROR: Response contains JSON/function definitions!');
      console.log('   Full response:', lastResponse1);
    } else {
      console.log('   ✅ Response is clean (no JSON contamination)\n');
    }

    // Test 2: Exercise update request
    console.log('3️⃣ Test 2: Requesting to update exercise...');
    await page.type(inputSelector, 'אני רוצה לעדכן אימון');
    await delay(500);
    await page.keyboard.press('Enter');
    console.log('   Message sent, waiting for response...');
    await delay(3000);
    
    // Take screenshot
    await page.screenshot({ path: 'test-3-update-request-openai.png' });
    
    // Get response
    const messages2 = await page.evaluate(() => {
      const msgs = document.querySelectorAll('[class*="message"], [class*="bubble"], [class*="text"]');
      return Array.from(msgs).map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    const lastResponse2 = messages2[messages2.length - 1];
    console.log(`   Response: "${lastResponse2}"`);
    
    // Check if bot asks for exercise details
    if (lastResponse2?.includes('איזה תרגיל') || lastResponse2?.includes('מה עשית') || lastResponse2?.includes('מה אימנת')) {
      console.log('   ✅ Bot correctly asks for exercise details\n');
    } else if (lastResponse2?.includes('function=')) {
      console.log('   ❌ ERROR: Bot shows function definition instead of asking!');
    } else if (lastResponse2?.includes('בעיה טכנית')) {
      console.log('   ❌ ERROR: Technical error - tool calling failed');
    } else {
      console.log('   ⚠️ Unexpected response format\n');
    }

    // Test 3: Provide exercise details
    console.log('4️⃣ Test 3: Providing exercise details...');
    await page.type(inputSelector, 'עשיתי 30 סקוואטים');
    await delay(500);
    await page.keyboard.press('Enter');
    console.log('   Message sent, waiting for response...');
    await delay(3000);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-4-exercise-logged-openai.png' });
    
    // Get final response
    const messages3 = await page.evaluate(() => {
      const msgs = document.querySelectorAll('[class*="message"], [class*="bubble"], [class*="text"]');
      return Array.from(msgs).map(el => el.textContent?.trim()).filter(Boolean);
    });
    
    const lastResponse3 = messages3[messages3.length - 1];
    console.log(`   Response: "${lastResponse3}"`);
    
    // Check if exercise was logged
    if (lastResponse3?.includes('רשמתי') && lastResponse3?.includes('30')) {
      console.log('   ✅ Exercise logged successfully!\n');
    } else if (lastResponse3?.includes('בעיה טכנית')) {
      console.log('   ❌ ERROR: Tool calling failed with technical error');
      console.log('   This indicates the OpenAI provider may not be working correctly\n');
    } else {
      console.log('   ⚠️ Unexpected response\n');
    }

    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log('Screenshots saved:');
    console.log('  - test-1-initial-openai.png');
    console.log('  - test-2-greeting-openai.png');
    console.log('  - test-3-update-request-openai.png');
    console.log('  - test-4-exercise-logged-openai.png');
    console.log('\nCheck console output above for provider initialization status');
    console.log('If you see "OpenAI provider initialized (PRIMARY)" then GPT-4o-mini is being used');

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test-error-openai.png' });
  } finally {
    await delay(3000); // Keep browser open to inspect
    await browser.close();
  }
}

// Run the test
testOpenAIIntegration().catch(console.error);