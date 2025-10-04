const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleLogs.push(`[${type}] ${text}`);
    console.log(`Browser ${type}: ${text}`);
  });
  
  // Capture page errors
  page.on('pageerror', error => {
    console.log('Page error:', error.message);
    consoleLogs.push(`[ERROR] ${error.message}`);
  });
  
  // Capture request failures
  page.on('requestfailed', request => {
    console.log('Request failed:', request.url(), request.failure().errorText);
    consoleLogs.push(`[NETWORK] Failed: ${request.url()} - ${request.failure().errorText}`);
  });
  
  console.log('Navigating to SweatBot...');
  await page.goto('http://localhost:8005/', { waitUntil: 'networkidle' });
  
  // Wait for app to load
  await page.waitForTimeout(2000);
  
  // Test flow
  console.log('\n=== Testing Exercise Update Flow ===\n');
  
  const inputSelector = 'input[type="text"], textarea';
  await page.waitForSelector(inputSelector);
  
  // First: Greeting
  console.log('1. Sending greeting...');
  await page.fill(inputSelector, 'היי');
  await page.press(inputSelector, 'Enter');
  await page.waitForTimeout(3000);
  
  // Second: Request to update workout
  console.log('2. Requesting to update workout...');
  await page.fill(inputSelector, 'אני רוצה לעדכן אימון');
  await page.press(inputSelector, 'Enter');
  await page.waitForTimeout(3000);
  
  // Third: Provide exercise details
  console.log('3. Providing exercise details...');
  await page.fill(inputSelector, 'עשיתי 30 סקוואטים');
  await page.press(inputSelector, 'Enter');
  await page.waitForTimeout(5000);
  
  // Take final screenshot
  await page.screenshot({ path: 'test-debug-final.png' });
  
  // Print all console logs
  console.log('\n=== All Console Logs ===\n');
  consoleLogs.forEach(log => console.log(log));
  
  // Extract visible text
  const visibleText = await page.evaluate(() => {
    const messages = [];
    document.querySelectorAll('*').forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && text.length < 200 && 
          !text.includes('SweatBot') && !text.includes('המאמן') &&
          (text.includes('מצטער') || text.includes('עשיתי') || text.includes('מעולה') || text.includes('רשמתי'))) {
        messages.push(text);
      }
    });
    return [...new Set(messages)]; // Remove duplicates
  });
  
  console.log('\n=== Visible Messages ===\n');
  visibleText.forEach((msg, i) => console.log(`${i + 1}. ${msg}`));
  
  await browser.close();
  console.log('\nDebug test completed!');
})();