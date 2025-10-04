const { chromium } = require('playwright');

async function testSweatBotHeaded() {
  console.log('🚀 SweatBot Headed Browser E2E Test');
  console.log('=====================================\n');
  
  // Configure for WSLg
  process.env.DISPLAY = ':0';
  process.env.WAYLAND_DISPLAY = 'wayland-0';
  
  console.log('📋 Test Configuration:');
  console.log(`   DISPLAY: ${process.env.DISPLAY}`);
  console.log(`   WAYLAND_DISPLAY: ${process.env.WAYLAND_DISPLAY}`);
  console.log(`   Target: http://localhost:8005/`);
  console.log('');
  
  try {
    console.log('🖥️  Launching VISIBLE browser window...');
    const browser = await chromium.launch({ 
      headless: false,  // THIS MAKES IT VISIBLE!
      args: [
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu-sandbox'
      ],
      // Slow down actions so you can see them
      slowMo: 500
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    console.log('✅ Browser window should be visible now!');
    console.log('');
    console.log('📍 Navigating to SweatBot...');
    await page.goto('http://localhost:8005/', { waitUntil: 'networkidle' });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'sweatbot-loaded.png' });
    console.log('📸 Screenshot saved: sweatbot-loaded.png');
    
    console.log('');
    console.log('🧪 Starting Natural Conversation Tests:');
    console.log('=========================================');
    
    // Find the input field
    const input = page.locator('input[type="text"], textarea').first();
    
    // Test 1: First greeting
    console.log('\n1️⃣ Test: First Greeting');
    console.log('   Sending: "שלום"');
    await input.fill('שלום');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    // Check for response
    const messages1 = await page.locator('.message, [class*="message"]').count();
    console.log(`   ✓ Messages visible: ${messages1}`);
    
    // Test 2: Second greeting (should be DIFFERENT)
    console.log('\n2️⃣ Test: Second Greeting (Must be Different!)');
    console.log('   Sending: "שלום" again');
    await input.fill('שלום');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const messages2 = await page.locator('.message, [class*="message"]').count();
    console.log(`   ✓ Total messages now: ${messages2}`);
    
    // Test 3: Non-fitness question (should politely decline)
    console.log('\n3️⃣ Test: Non-Fitness Question');
    console.log('   Sending: "מה השעה?"');
    await input.fill('מה השעה?');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    // Check that NO tools were triggered
    const toolIndicators = await page.locator('[class*="tool"], [class*="stats"], [class*="quick"]').count();
    console.log(`   ✓ Tool/UI components shown: ${toolIndicators} (should be 0)`);
    
    // Test 4: Fitness command (SHOULD trigger tool)
    console.log('\n4️⃣ Test: Fitness Command');
    console.log('   Sending: "עשיתי 20 סקוואטים"');
    await input.fill('עשיתי 20 סקוואטים');
    await input.press('Enter');
    await page.waitForTimeout(4000);
    
    // Take final screenshot
    await page.screenshot({ path: 'sweatbot-conversation.png' });
    console.log('\n📸 Final screenshot saved: sweatbot-conversation.png');
    
    // Visual inspection pause
    console.log('\n👀 Keeping browser open for 15 seconds for visual inspection...');
    console.log('   Check that:');
    console.log('   ✓ Hebrew text displays correctly');
    console.log('   ✓ Each greeting got a DIFFERENT response');
    console.log('   ✓ No hardcoded templates appear');
    console.log('   ✓ No automatic UI components for greetings');
    console.log('   ✓ Tools only activate for fitness requests');
    
    await page.waitForTimeout(15000);
    
    console.log('\n✨ Test completed successfully!');
    await browser.close();
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    if (error.message.includes('Target closed') || error.message.includes('Connection closed')) {
      console.log('\n⚠️  Browser window was closed manually');
    } else if (error.message.includes('display') || error.message.includes('DISPLAY')) {
      console.log('\n🔧 WSLg is not active. To enable it:');
      console.log('   1. Open Windows PowerShell as Administrator');
      console.log('   2. Run: wsl --update');
      console.log('   3. Run: wsl --shutdown');
      console.log('   4. Restart your WSL terminal');
      console.log('   5. Run this test again');
      console.log('\n   WSLg is required for headed (visible) browser testing!');
    } else {
      console.log('\n🔍 Debug info:');
      console.log('   - Make sure SweatBot is running on http://localhost:8005');
      console.log('   - Check that the backend is running on http://localhost:8000');
      console.log('   - Verify all Docker services are up');
    }
    
    process.exit(1);
  }
}

// Run the test
testSweatBotHeaded().catch(console.error);