const { chromium } = require('playwright');

async function testSweatBotVisual() {
  console.log('👁️  SweatBot Visual Browser Test');
  console.log('==================================\n');
  
  // Try WSLg first, fallback to headless if not available
  let headless = false;
  
  // Configure for WSLg
  process.env.DISPLAY = ':0';
  process.env.WAYLAND_DISPLAY = 'wayland-0';
  
  console.log('📋 Configuration:');
  console.log(`   Mode: Attempting HEADED (visual) browser`);
  console.log(`   Target: http://localhost:8005/`);
  console.log('');
  
  let browser;
  
  try {
    // Try headed first
    console.log('🖥️  Attempting to launch VISIBLE browser...');
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000, // Slow down actions so you can see them
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✅ Headed browser launched! You should see a window!');
  } catch (headedError) {
    console.log('⚠️  Headed browser failed, falling back to headless...');
    console.log('   (To enable headed mode: wsl --update && wsl --shutdown)\n');
    headless = true;
    browser = await chromium.launch({ 
      headless: true 
    });
    console.log('✅ Running in headless mode (no visual window)');
  }
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    console.log('\n📍 Navigating to SweatBot...');
    await page.goto('http://localhost:8005/', { waitUntil: 'networkidle' });
    
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({ path: 'visual-test-1-initial.png' });
    
    // Find the chat container
    console.log('\n🔍 Analyzing page structure...');
    const chatContainer = await page.evaluate(() => {
      const body = document.body.innerText;
      return {
        hasSweatBot: body.includes('SweatBot'),
        hasHebrew: /[\u0590-\u05FF]/.test(body),
        pageText: body.substring(0, 100)
      };
    });
    
    console.log('   ✓ SweatBot found:', chatContainer.hasSweatBot);
    console.log('   ✓ Hebrew support:', chatContainer.hasHebrew);
    
    // Find input field
    const input = await page.locator('input[type="text"], textarea').first();
    console.log('   ✓ Input field found');
    
    console.log('\n🧪 CRITICAL CONVERSATION TESTS:');
    console.log('=================================\n');
    
    // Test 1: Send first greeting
    console.log('📝 TEST 1: Sending "שלום"...');
    await input.fill('שלום');
    await page.screenshot({ path: 'visual-test-2-typing.png' });
    await input.press('Enter');
    
    console.log('   ⏳ Waiting for response...');
    await page.waitForTimeout(3000);
    
    // Get the response
    const response1 = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(line => line.trim());
      // Find the last non-empty line that's not the input
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i] !== 'שלום' && lines[i].length > 10) {
          return lines[i];
        }
      }
      return 'No response found';
    });
    
    console.log('   📨 Response:', response1.substring(0, 60) + '...');
    await page.screenshot({ path: 'visual-test-3-response1.png' });
    
    // Check if it's the hardcoded template
    const isTemplate = response1.includes('אני SweatBot') || response1.includes('הבוט האישי שלך');
    if (isTemplate) {
      console.log('   ❌ FAIL: Hardcoded template detected!');
    } else {
      console.log('   ✅ PASS: Natural response (not template)');
    }
    
    // Test 2: Send second greeting
    console.log('\n📝 TEST 2: Sending "שלום" again...');
    await input.fill('שלום');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response2 = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(line => line.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i] !== 'שלום' && lines[i].length > 10) {
          return lines[i];
        }
      }
      return 'No response found';
    });
    
    console.log('   📨 Response:', response2.substring(0, 60) + '...');
    await page.screenshot({ path: 'visual-test-4-response2.png' });
    
    // Check if responses are different
    if (response1 === response2) {
      console.log('   ❌ FAIL: Identical responses - system is using hardcoded messages!');
    } else {
      console.log('   ✅ PASS: Different responses - natural conversation working');
    }
    
    // Test 3: Non-fitness question
    console.log('\n📝 TEST 3: Sending "מה השעה?" (non-fitness)...');
    await input.fill('מה השעה?');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    const response3 = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(line => line.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i] !== 'מה השעה?' && lines[i].length > 10) {
          return lines[i];
        }
      }
      return 'No response found';
    });
    
    console.log('   📨 Response:', response3.substring(0, 60) + '...');
    await page.screenshot({ path: 'visual-test-5-nonfitness.png' });
    
    // Should politely decline, not show stats
    const triggeredTool = response3.includes('נקודות') || response3.includes('points') || response3.includes('סטטיסטיקה');
    if (triggeredTool) {
      console.log('   ❌ FAIL: Incorrectly triggered fitness tool for time question!');
    } else {
      console.log('   ✅ PASS: Correctly handled non-fitness question');
    }
    
    // Test 4: Fitness command
    console.log('\n📝 TEST 4: Sending "עשיתי 20 סקוואטים" (fitness)...');
    await input.fill('עשיתי 20 סקוואטים');
    await input.press('Enter');
    await page.waitForTimeout(4000);
    
    const response4 = await page.evaluate(() => {
      const allText = document.body.innerText;
      const lines = allText.split('\n').filter(line => line.trim());
      for (let i = lines.length - 1; i >= 0; i--) {
        if (!lines[i].includes('עשיתי') && lines[i].length > 10) {
          return lines[i];
        }
      }
      return 'No response found';
    });
    
    console.log('   📨 Response:', response4.substring(0, 60) + '...');
    await page.screenshot({ path: 'visual-test-6-fitness.png' });
    
    const confirmedExercise = response4.includes('20') || response4.includes('סקוואט') || response4.includes('רשמתי') || response4.includes('נקודות');
    if (confirmedExercise) {
      console.log('   ✅ PASS: Exercise was logged with tool');
    } else {
      console.log('   ⚠️  WARNING: May not have logged exercise properly');
    }
    
    // Final summary
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log('Screenshots saved: visual-test-*.png');
    
    if (!headless) {
      console.log('\n👀 Keeping browser open for 10 seconds for inspection...');
      await page.waitForTimeout(10000);
    }
    
    console.log('\n✨ Test completed!');
    
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testSweatBotVisual().catch(console.error);