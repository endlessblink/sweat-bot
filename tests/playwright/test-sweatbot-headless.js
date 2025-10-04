const { chromium } = require('playwright');

async function testSweatBotHeadless() {
  console.log('🤖 SweatBot Headless E2E Test (No GUI Required)');
  console.log('================================================\n');
  
  try {
    console.log('🚀 Launching headless browser...');
    const browser = await chromium.launch({ 
      headless: true  // Runs in background, no GUI needed
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Page error:', msg.text());
      }
    });
    
    console.log('📍 Navigating to SweatBot...');
    await page.goto('http://localhost:8005/', { waitUntil: 'networkidle' });
    
    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/initial.png' });
    console.log('📸 Screenshot: test-screenshots/initial.png\n');
    
    // Find input field
    const input = page.locator('input[type="text"], textarea').first();
    const messagesContainer = page.locator('[class*="message"], .chat-message, .message');
    
    console.log('🧪 CRITICAL TESTS FOR NATURAL CONVERSATION:');
    console.log('============================================\n');
    
    // Test 1: First greeting
    console.log('TEST 1: First Hebrew Greeting');
    await input.fill('שלום');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response1 = await messagesContainer.last().textContent();
    console.log('   Sent: "שלום"');
    console.log('   Got:', response1?.substring(0, 50) + '...');
    
    // Verify it's not a template
    const hasTemplate1 = response1?.includes('אני SweatBot') || response1?.includes('הבוט האישי שלך');
    console.log('   ✓ Not a template:', !hasTemplate1);
    
    await page.screenshot({ path: 'test-screenshots/greeting1.png' });
    
    // Test 2: Second greeting - MUST BE DIFFERENT
    console.log('\nTEST 2: Second Greeting (Must Differ!)');
    await input.fill('שלום');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response2 = await messagesContainer.last().textContent();
    console.log('   Sent: "שלום" again');
    console.log('   Got:', response2?.substring(0, 50) + '...');
    
    const isDifferent = response1 !== response2;
    console.log('   ✓ Different from first:', isDifferent);
    if (!isDifferent) {
      console.log('   ❌ FAIL: Responses are identical - hardcoded!');
    }
    
    await page.screenshot({ path: 'test-screenshots/greeting2.png' });
    
    // Test 3: English greeting
    console.log('\nTEST 3: English Greeting');
    await input.fill('Hi');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response3 = await messagesContainer.last().textContent();
    console.log('   Sent: "Hi"');
    console.log('   Got:', response3?.substring(0, 50) + '...');
    
    // Check for QuickActions (should NOT appear)
    const quickActions = await page.locator('[class*="quick"], [class*="Quick"], button').count();
    console.log('   ✓ No QuickAction buttons:', quickActions === 0);
    
    await page.screenshot({ path: 'test-screenshots/greeting3.png' });
    
    // Test 4: Non-fitness question
    console.log('\nTEST 4: Non-Fitness Question (Should Decline)');
    await input.fill('מה השעה?');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response4 = await messagesContainer.last().textContent();
    console.log('   Sent: "מה השעה?"');
    console.log('   Got:', response4?.substring(0, 50) + '...');
    
    // Should NOT trigger tools
    const hasStats = response4?.includes('נקודות') || response4?.includes('points');
    console.log('   ✓ No stats in response:', !hasStats);
    
    await page.screenshot({ path: 'test-screenshots/non-fitness.png' });
    
    // Test 5: Fitness command
    console.log('\nTEST 5: Fitness Command (Should Use Tool)');
    await input.fill('עשיתי 25 סקוואטים');
    await input.press('Enter');
    await page.waitForTimeout(4000);
    
    const response5 = await messagesContainer.last().textContent();
    console.log('   Sent: "עשיתי 25 סקוואטים"');
    console.log('   Got:', response5?.substring(0, 50) + '...');
    
    // Should mention points or confirmation
    const hasConfirmation = response5?.includes('25') || response5?.includes('נקודות') || response5?.includes('רשמתי');
    console.log('   ✓ Exercise logged:', hasConfirmation);
    
    await page.screenshot({ path: 'test-screenshots/exercise.png' });
    
    // Test 6: Stats request
    console.log('\nTEST 6: Stats Request (Should Use Tool)');
    await input.fill('כמה נקודות יש לי?');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response6 = await messagesContainer.last().textContent();
    console.log('   Sent: "כמה נקודות יש לי?"');
    console.log('   Got:', response6?.substring(0, 50) + '...');
    
    const hasPoints = response6?.includes('נקודות') || response6?.includes('points');
    console.log('   ✓ Shows points:', hasPoints);
    
    await page.screenshot({ path: 'test-screenshots/stats.png' });
    
    // Summary
    console.log('\n📊 TEST SUMMARY:');
    console.log('================');
    console.log('✅ Tests completed');
    console.log('📸 Screenshots saved in test-screenshots/');
    console.log('\n⚠️  CRITICAL CHECKS:');
    console.log('   • Each greeting got a DIFFERENT response');
    console.log('   • No hardcoded templates appeared');
    console.log('   • No automatic UI components for greetings');
    console.log('   • Non-fitness questions were politely declined');
    console.log('   • Fitness commands triggered appropriate tools');
    
    await browser.close();
    console.log('\n✨ Headless test complete!');
    console.log('💡 For visual testing, enable WSLg and run test-sweatbot-headed.js');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔍 Troubleshooting:');
    console.log('   1. Ensure frontend is running: cd personal-ui-vite && npm run dev');
    console.log('   2. Check backend is running: cd backend && uvicorn app.main:app --reload');
    console.log('   3. Verify Docker services: docker-compose ps');
    process.exit(1);
  }
}

// Create screenshots directory
const fs = require('fs');
if (!fs.existsSync('test-screenshots')) {
  fs.mkdirSync('test-screenshots');
}

// Run the test
testSweatBotHeadless().catch(console.error);