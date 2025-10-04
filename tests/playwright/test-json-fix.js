const { chromium } = require('playwright');

async function testJsonFix() {
  console.log('🔧 Testing JSON Display Fix');
  console.log('===========================\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8005/');
  await page.waitForTimeout(2000); // Wait for any hot reload
  
  console.log('📝 Sending exercise command...');
  const input = await page.locator('input[type="text"]').first();
  await input.fill('עשיתי 25 סקוואטים');
  await input.press('Enter');
  
  console.log('⏳ Waiting for response...');
  await page.waitForTimeout(4000);
  
  // Get the response
  const response = await page.evaluate(() => {
    const msgs = document.querySelectorAll('.bg-neutral-950');
    const lastMsg = msgs[msgs.length - 1];
    return {
      text: lastMsg?.textContent || 'No response',
      html: lastMsg?.innerHTML || 'No HTML'
    };
  });
  
  console.log('📨 Raw response:', response.text);
  console.log('');
  
  // Analysis
  const hasJson = response.text.includes('{"content":"') || response.text.includes('"model"');
  const hasHebrew = /[\u0590-\u05FF]/.test(response.text);
  const hasToolConfirmation = response.text.includes('רשמתי') || response.text.includes('25');
  
  console.log('🔍 Analysis:');
  console.log('   Contains JSON:', hasJson ? '❌ YES (bad)' : '✅ NO (good)');
  console.log('   Contains Hebrew:', hasHebrew ? '✅ YES' : '❌ NO');
  console.log('   Exercise confirmed:', hasToolConfirmation ? '✅ YES' : '❌ NO');
  console.log('');
  
  if (!hasJson && hasHebrew && hasToolConfirmation) {
    console.log('🎉 SUCCESS: JSON fix is working!');
  } else if (hasJson) {
    console.log('⚠️ ISSUE: Raw JSON still appearing in UI');
    console.log('   This means the sanitization isn\'t catching it');
  } else {
    console.log('❓ UNCLEAR: Response format unexpected');
  }
  
  await browser.close();
}

testJsonFix().catch(console.error);