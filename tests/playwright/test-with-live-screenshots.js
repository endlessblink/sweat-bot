const { chromium } = require('playwright');
const fs = require('fs');

async function testWithLiveScreenshots() {
  console.log('📸 SweatBot Test with Live Screenshot Viewing');
  console.log('==============================================\n');
  console.log('This test runs headless but takes screenshots you can view!\n');
  
  const browser = await chromium.launch({ 
    headless: true  // Must be headless without display server
  });
  
  const page = await browser.newPage();
  let screenshotCount = 0;
  
  // Helper to take and report screenshot
  async function snap(description) {
    screenshotCount++;
    const filename = `live-screenshot-${screenshotCount}.png`;
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 [${screenshotCount}] ${description}`);
    console.log(`   View: ${filename}`);
    console.log('');
  }
  
  try {
    console.log('🚀 Starting test...\n');
    
    await page.goto('http://localhost:8005/');
    await snap('Initial page load');
    
    // Test greeting
    const input = page.locator('input[type="text"], textarea').first();
    await input.fill('שלום');
    await snap('Typed "שלום" in input');
    
    await input.press('Enter');
    await page.waitForTimeout(2000);
    await snap('After sending greeting');
    
    // Test another greeting
    await input.fill('Hi');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    await snap('After sending "Hi"');
    
    // Test non-fitness
    await input.fill('מה השעה?');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    await snap('After asking time (non-fitness)');
    
    // Test fitness command
    await input.fill('עשיתי 30 סקוואטים');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    await snap('After logging exercise');
    
    console.log('✅ Test complete!');
    console.log(`📁 Generated ${screenshotCount} screenshots in current directory`);
    console.log('\n💡 TIP: Open the PNG files to see what happened!');
    console.log('   On Windows: Just double-click the files');
    console.log('   On WSL2: Use "explorer.exe ." to open folder\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testWithLiveScreenshots().catch(console.error);