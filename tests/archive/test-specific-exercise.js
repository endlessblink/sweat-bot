const { chromium } = require('playwright');

async function testSpecificExercise() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        await page.goto('http://localhost:8006');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('input[placeholder="שלח הודעה..."]', { timeout: 10000 });
        
        const input = page.locator('input[placeholder="שלח הודעה..."]');
        const sendButton = page.locator('button').filter({ hasText: /→|send/i });
        
        console.log('🧪 Testing: 30 שכיבות סמיכה');
        await input.fill('30 שכיבות סמיכה');
        await sendButton.click();
        await page.waitForTimeout(4000);
        
        const response = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        console.log(`🤖 Full Response: "${response}"`);
        
        const shouldMatch = response?.includes('רשמתי לך') && response?.includes('שכיבות סמיכה') && response?.includes('30');
        console.log(shouldMatch ? '✅ Pattern worked!' : '❌ Pattern failed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

testSpecificExercise();