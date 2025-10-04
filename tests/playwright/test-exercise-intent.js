const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true // Run headless with screenshots
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to SweatBot...');
  await page.goto('http://localhost:8005/', { waitUntil: 'networkidle' });
  
  // Wait for app to load
  await page.waitForTimeout(2000);
  
  // Test 1: Send greeting
  console.log('Test 1: Sending greeting...');
  const inputSelector = 'input[type="text"], textarea';
  await page.waitForSelector(inputSelector);
  await page.fill(inputSelector, 'היי');
  
  // Submit the message
  await page.press(inputSelector, 'Enter');
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Take screenshot of greeting response
  await page.screenshot({ path: 'test-1-greeting.png' });
  console.log('Screenshot 1 saved: test-1-greeting.png');
  
  // Test 2: Request to update workout (should ask for details)
  console.log('Test 2: Requesting to update workout...');
  await page.fill(inputSelector, 'אני רוצה לעדכן אימון');
  await page.press(inputSelector, 'Enter');
  
  // Wait for response (should ask what exercise)
  await page.waitForTimeout(3000);
  
  // Take screenshot of the asking response
  await page.screenshot({ path: 'test-2-update-request.png' });
  console.log('Screenshot 2 saved: test-2-update-request.png');
  
  // Test 3: Provide exercise details
  console.log('Test 3: Providing exercise details...');
  await page.fill(inputSelector, 'עשיתי 30 סקוואטים');
  await page.press(inputSelector, 'Enter');
  
  // Wait for response (should log the exercise)
  await page.waitForTimeout(3000);
  
  // Take screenshot of exercise logging
  await page.screenshot({ path: 'test-3-exercise-logged.png' });
  console.log('Screenshot 3 saved: test-3-exercise-logged.png');
  
  // Get the conversation text for analysis
  console.log('\n=== Extracting conversation text ===');
  
  const messages = await page.evaluate(() => {
    const messageElements = document.querySelectorAll('.message, [class*="message"], [class*="Message"], div[style*="padding"], div[style*="margin"]');
    const texts = [];
    messageElements.forEach(el => {
      const text = el.textContent?.trim();
      if (text && text.length > 0 && !text.includes('SweatBot') && !text.includes('המאמן')) {
        texts.push(text);
      }
    });
    return texts;
  });
  
  console.log('Conversation messages:');
  messages.forEach((msg, index) => {
    console.log(`  ${index + 1}. ${msg}`);
  });
  
  // Check for JSON in responses
  const hasJSON = messages.some(msg => msg.includes('{"content"') || msg.includes('"model"') || msg.includes('"toolCalls"'));
  if (hasJSON) {
    console.error('\n❌ ERROR: JSON found in responses!');
  } else {
    console.log('\n✅ SUCCESS: No JSON in responses!');
  }
  
  // Check if bot asked for details when requested to update
  const responseAfterUpdateRequest = messages[messages.indexOf('אני רוצה לעדכן אימון') + 1];
  if (responseAfterUpdateRequest && (
    responseAfterUpdateRequest.includes('איזה תרגיל') ||
    responseAfterUpdateRequest.includes('מה אימנת') ||
    responseAfterUpdateRequest.includes('מה עשית') ||
    responseAfterUpdateRequest.includes('איזה אימון')
  )) {
    console.log('✅ SUCCESS: Bot correctly asked for exercise details!');
  } else {
    console.error('❌ ERROR: Bot did not ask for exercise details. Response was:', responseAfterUpdateRequest);
  }
  
  await browser.close();
  console.log('\nTest completed!');
})();