const { chromium } = require('playwright');

async function testExerciseTool() {
  console.log('🏋️ Testing Exercise Tool Execution');
  console.log('=====================================\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture ALL console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    // Show important logs
    if (text.includes('Executing tool') || 
        text.includes('Tool execution') || 
        text.includes('toolCalls') ||
        text.includes('Unknown response')) {
      console.log('[Console]', text);
    }
  });
  
  await page.goto('http://localhost:8005/');
  await page.waitForTimeout(1000);
  
  console.log('📝 Sending exercise command...');
  const input = await page.locator('input[type="text"]').first();
  await input.fill('רשום 30 סקוואטים');
  await input.press('Enter');
  
  console.log('⏳ Waiting for response...\n');
  await page.waitForTimeout(5000);
  
  // Get the response
  const response = await page.evaluate(() => {
    const msgs = document.querySelectorAll('.bg-neutral-950');
    const lastMsg = msgs[msgs.length - 1];
    return {
      text: lastMsg?.textContent || 'No response',
      html: lastMsg?.innerHTML || 'No HTML'
    };
  });
  
  console.log('📨 Response text:', response.text);
  console.log('');
  
  // Show relevant logs
  console.log('🔍 Relevant console logs:');
  logs.forEach(log => {
    if (log.includes('Groq') || log.includes('tool') || log.includes('Tool')) {
      console.log('  -', log);
    }
  });
  
  // Check success
  if (response.text.includes('רשמתי') || response.text.includes('30')) {
    console.log('\n✅ SUCCESS: Exercise was logged!');
  } else if (response.text.includes('בעיה טכנית')) {
    console.log('\n❌ FAIL: Got error fallback response');
  } else {
    console.log('\n⚠️  UNKNOWN: Unexpected response');
  }
  
  await browser.close();
}

testExerciseTool().catch(console.error);