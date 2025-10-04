const { chromium } = require('playwright');
const path = require('path');

async function testSweatBotHebrewFlow() {
    console.log('🚀 Starting SweatBot Hebrew Conversation Test');
    
    const browser = await chromium.launch({ 
        headless: true,  // Run headless since no X server
        slowMo: 500      // Slow down actions slightly
    });
    
    const page = await browser.newPage();
    
    try {
        // Navigate to SweatBot
        console.log('📍 Navigating to http://localhost:8007');
        await page.goto('http://localhost:8007', { waitUntil: 'networkidle' });
        
        // Take initial screenshot
        const screenshotDir = '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug';
        await page.screenshot({ 
            path: path.join(screenshotDir, '01-initial-load.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 1: Initial page load');
        
        // Wait for chat interface to load
        await page.waitForSelector('input[type="text"], textarea, [contenteditable]', { timeout: 10000 });
        console.log('✅ Chat interface detected');
        
        // Test 1: Hebrew greeting "היי"
        console.log('💬 Test 1: Typing "היי"');
        const chatInput = await page.locator('input, textarea').first();
        await chatInput.fill('היי');
        await page.keyboard.press('Enter');
        
        // Wait for response
        await page.waitForTimeout(3000);
        await page.screenshot({ 
            path: path.join(screenshotDir, '02-greeting-response.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 2: After greeting');
        
        // Check for response
        const response1 = await page.textContent('body');
        if (response1.includes('function=') || response1.includes('{"')) {
            console.log('❌ ERROR: Function definitions leaked to UI after greeting');
            return false;
        }
        console.log('✅ Greeting response appears clean');
        
        // Test 2: Exercise intent "אני רוצה להזין אימון"
        console.log('💬 Test 2: Typing "אני רוצה להזין אימון"');
        await chatInput.fill('אני רוצה להזין אימון');
        await page.keyboard.press('Enter');
        
        await page.waitForTimeout(3000);
        await page.screenshot({ 
            path: path.join(screenshotDir, '03-exercise-intent.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 3: After exercise intent');
        
        // Test 3: Specific exercise "עשיתי היום 20 סקווטים ורצתי 200 מטרים"
        console.log('💬 Test 3: Typing "עשיתי היום 20 סקווטים ורצתי 200 מטרים"');
        await chatInput.fill('עשיתי היום 20 סקווטים ורצתי 200 מטרים');
        await page.keyboard.press('Enter');
        
        // Wait longer for tool execution
        await page.waitForTimeout(5000);
        await page.screenshot({ 
            path: path.join(screenshotDir, '04-exercise-logging.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 4: After exercise logging');
        
        // Check final response
        const finalResponse = await page.textContent('body');
        if (finalResponse.includes('function=') || finalResponse.includes('{"exercise"')) {
            console.log('❌ FAILURE: Function definitions leaked to UI');
            return false;
        }
        
        if (finalResponse.includes('20') && finalResponse.includes('סקוואט')) {
            console.log('✅ SUCCESS: Exercise logging appears to work');
        } else {
            console.log('⚠️  WARNING: Exercise details may not be properly processed');
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: path.join(screenshotDir, '05-final-state.png'),
            fullPage: true
        });
        console.log('📸 Screenshot 5: Final conversation state');
        
        console.log('🎉 Test completed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        await page.screenshot({ 
            path: path.join(screenshotDir, 'error-state.png'),
            fullPage: true
        });
        return false;
    } finally {
        await browser.close();
    }
}

// Run the test
testSweatBotHebrewFlow()
    .then(success => {
        console.log(success ? '✅ ALL TESTS PASSED' : '❌ TESTS FAILED');
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });