const { chromium } = require('playwright');

async function testHebrewExercise() {
    console.log('🧪 Testing Hebrew Exercise Logging...');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        console.log('📍 Navigating to SweatBot...');
        await page.goto('http://localhost:8006');
        await page.waitForLoadState('networkidle');
        
        // Wait for chat interface
        await page.waitForSelector('input[placeholder="שלח הודעה..."]', { timeout: 10000 });
        console.log('✅ Chat interface loaded');
        
        // Test Hebrew rope climb exercise
        console.log('\n🧪 Testing: עשיתי 4 טיפוסי חבל');
        const input = page.locator('input[placeholder="שלח הודעה..."]');
        const sendButton = page.locator('button').filter({ hasText: /→|send/i });
        
        await input.fill('עשיתי 4 טיפוסי חבל');
        await sendButton.click();
        await page.waitForTimeout(5000); // Wait for response
        
        // Get response
        const response = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        console.log(`🤖 Response: ${response}`);
        
        // Check if Hebrew parsing worked
        const success = response?.includes('רשמתי לך') && 
                       response?.includes('טיפוסי חבל') && 
                       response?.includes('4') &&
                       response?.includes('כל הכבוד');
        
        console.log(success ? '✅ Hebrew exercise parsing WORKS!' : '❌ Hebrew exercise parsing failed');
        console.log(`Response analysis:
        - Contains "רשמתי לך": ${response?.includes('רשמתי לך')}
        - Contains "טיפוסי חבל": ${response?.includes('טיפוסי חבל')}
        - Contains "4": ${response?.includes('4')}
        - Contains "כל הכבוד": ${response?.includes('כל הכבוד')}`);
        
        await page.screenshot({ path: 'hebrew-exercise-test.png', fullPage: true });
        console.log('📸 Screenshot saved: hebrew-exercise-test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

testHebrewExercise();