const { chromium } = require('playwright');

async function testSweatBotFinal() {
    console.log('🧪 Testing SweatBot Final Implementation...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const tests = [
        {
            name: 'Hebrew Exercise with Date',
            input: 'אתמול 24.8 - 4 טיפוסי חבל',
            expectedPatterns: ['רשמתי', '4', 'טיפוסי חבל', 'ראה סטטיסטיקות']
        },
        {
            name: 'Simple Exercise',
            input: 'עשיתי 20 סקוואטים',
            expectedPatterns: ['רשמתי', '20', 'סקוואטים', 'ראה סטטיסטיקות']
        },
        {
            name: 'Stats Request',
            input: 'בדוק את הסטטיסטיקות שלי',
            expectedPatterns: ['סטטיסטיקות', 'נקודות', 'הצג פאנל']
        }
    ];
    
    try {
        console.log('📍 Navigating to SweatBot at http://localhost:8004...');
        await page.goto('http://localhost:8004');
        await page.waitForLoadState('networkidle');
        
        // Wait for chat interface
        await page.waitForSelector('input[placeholder="שלח הודעה..."]', { timeout: 10000 });
        console.log('✅ Chat interface loaded\n');
        
        const input = page.locator('input[placeholder="שלח הודעה..."]');
        const sendButton = page.locator('button').filter({ hasText: /→|send/i });
        
        for (const test of tests) {
            console.log(`🧪 Testing: ${test.name}`);
            console.log(`📝 Input: "${test.input}"`);
            
            await input.fill(test.input);
            await sendButton.click();
            await page.waitForTimeout(3000);
            
            // Get response
            const response = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
            console.log(`🤖 Response: ${response}`);
            
            // Check if response is SHORT (less than 100 chars is good)
            const isShort = response.length < 100;
            console.log(`📏 Response length: ${response.length} chars ${isShort ? '✅ SHORT' : '❌ TOO LONG'}`);
            
            // Check expected patterns
            let allPatternsFound = true;
            for (const pattern of test.expectedPatterns) {
                const found = response.includes(pattern);
                console.log(`   ${found ? '✅' : '❌'} Contains "${pattern}"`);
                if (!found) allPatternsFound = false;
            }
            
            // Check for clickable stats button
            const hasButton = await page.locator('button').filter({ hasText: /סטטיסטיקות|פאנל/i }).count() > 0;
            console.log(`   ${hasButton ? '✅' : '❌'} Has clickable stats button`);
            
            console.log(`Result: ${allPatternsFound && isShort ? '✅ PASS' : '❌ FAIL'}\n`);
        }
        
        // Test clicking stats button
        console.log('🧪 Testing Stats Panel Display');
        const statsButton = page.locator('button').filter({ hasText: /סטטיסטיקות|פאנל/i }).first();
        if (await statsButton.count() > 0) {
            await statsButton.click();
            await page.waitForTimeout(2000);
            
            // Check if stats panel appeared
            const statsPanel = await page.locator('text=/סטטיסטיקות שלך|נקודות כולל/i').count() > 0;
            console.log(`   ${statsPanel ? '✅' : '❌'} Stats panel displayed`);
            
            if (statsPanel) {
                // Check for real data elements
                const hasPoints = await page.locator('text=/נקודות כולל/i').count() > 0;
                const hasExercises = await page.locator('text=/אימונים אחרונים/i').count() > 0;
                console.log(`   ${hasPoints ? '✅' : '❌'} Shows points from database`);
                console.log(`   ${hasExercises ? '✅' : '❌'} Shows recent exercises`);
            }
        }
        
        await page.screenshot({ 
            path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/final-test.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved to docs/screenshots-debug/final-test.png');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
    
    await browser.close();
}

testSweatBotFinal();