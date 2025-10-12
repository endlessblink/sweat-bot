const { chromium } = require('playwright');

async function testMultipleExercises() {
    console.log('🧪 Testing Multiple Hebrew Exercise Variations...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const exercises = [
        'עשיתי 4 טיפוסי חבל',
        'אתמול 24.8 - 4 טיפוסי חבל',
        'עשיתי 20 סקוואטים',
        '30 שכיבות סמיכה',
        'רצתי 5 קילומטר'
    ];
    
    try {
        await page.goto('http://localhost:8006');
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('input[placeholder="שלח הודעה..."]', { timeout: 10000 });
        
        const input = page.locator('input[placeholder="שלח הודעה..."]');
        const sendButton = page.locator('button').filter({ hasText: /→|send/i });
        
        for (let i = 0; i < exercises.length; i++) {
            const exercise = exercises[i];
            console.log(`\n🧪 Test ${i + 1}: ${exercise}`);
            
            await input.fill(exercise);
            await sendButton.click();
            await page.waitForTimeout(3000);
            
            const response = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
            console.log(`🤖 Response: ${response?.substring(0, 100)}...`);
            
            const isGoodResponse = response?.includes('רשמתי') || response?.includes('כל הכבוד');
            console.log(isGoodResponse ? '✅ PASS' : '❌ FAIL');
        }
        
        await page.screenshot({ path: 'multiple-exercises-test.png', fullPage: true });
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

testMultipleExercises();