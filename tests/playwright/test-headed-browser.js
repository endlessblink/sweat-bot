const { chromium } = require('playwright');

async function testHeadedBrowser() {
  // Use WSLg for GUI support (no external X server needed!)
  process.env.DISPLAY = ':0';
  process.env.WAYLAND_DISPLAY = 'wayland-0';
  
  console.log('🖥️ Testing Headed Browser with WSLg');
  console.log('DISPLAY=' + process.env.DISPLAY);
  console.log('WAYLAND_DISPLAY=' + process.env.WAYLAND_DISPLAY);
  console.log('');
  console.log('Using WSLg - No external X server needed!');
  console.log('WSLg provides native GUI support in WSL2');
  console.log('');
  
  try {
    console.log('🚀 Launching headed browser...');
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    console.log('✅ Browser launched!');
    
    console.log('📍 Navigating to SweatBot...');
    await page.goto('http://localhost:8005/');
    
    console.log('📄 Page title:', await page.title());
    console.log('');
    console.log('🧪 Testing SweatBot functionality:');
    
    // Test 1: Type "Hi" and check response
    console.log('1️⃣ Testing greeting...');
    const input = page.locator('input[type="text"]');
    await input.fill('Hi');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    
    // Test 2: Type "Hi" again to check for different response
    console.log('2️⃣ Testing greeting variation...');
    await input.fill('Hi');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    
    // Test 3: Hebrew greeting
    console.log('3️⃣ Testing Hebrew greeting...');
    await input.fill('שלום');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    
    // Test 4: Non-fitness question
    console.log('4️⃣ Testing non-fitness question...');
    await input.fill('מה השעה?');
    await input.press('Enter');
    await page.waitForTimeout(2000);
    
    // Test 5: Fitness command
    console.log('5️⃣ Testing fitness command...');
    await input.fill('אני רוצה לרשום 20 סקוואטים');
    await input.press('Enter');
    await page.waitForTimeout(3000);
    
    console.log('');
    console.log('✨ All tests completed!');
    console.log('🖥️ Browser will stay open for 10 seconds for visual inspection...');
    
    await page.waitForTimeout(10000);
    
    await browser.close();
    console.log('✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    
    if (error.message.includes('X server') || error.message.includes('DISPLAY')) {
      console.log('🔧 To enable WSLg GUI support:');
      console.log('1. Open Windows PowerShell as Administrator');
      console.log('2. Run: wsl --update');
      console.log('3. Run: wsl --shutdown');
      console.log('4. Restart WSL and try again');
      console.log('');
      console.log('WSLg requires Windows 10 21H2+ or Windows 11');
    }
  }
}

testHeadedBrowser();