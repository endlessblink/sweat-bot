const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runSweatBotE2ETest() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        screenshots: []
    };
    
    let testNumber = 1;
    
    const addTest = (name, passed, details) => {
        console.log(`Test ${testNumber}: ${name} - ${passed ? 'PASS' : 'FAIL'}`);
        if (details) console.log(`  Details: ${details}`);
        results.tests.push({
            number: testNumber++,
            name,
            passed,
            details
        });
    };
    
    const takeScreenshot = async (name) => {
        const screenshotPath = `screenshot-${testNumber-1}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.push(screenshotPath);
        console.log(`Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
    };
    
    try {
        // Navigate to SweatBot
        console.log('🚀 Starting SweatBot E2E Test Suite');
        console.log('Navigating to http://localhost:8006...');
        await page.goto('http://localhost:8006');
        await page.waitForLoadState('networkidle');
        await takeScreenshot('initial-load');
        
        // Wait for the chat interface to be ready
        console.log('Waiting for chat interface to load...');
        await page.waitForSelector('input[placeholder="שלח הודעה..."]', { timeout: 10000 });
        
        // Test 1: First Greeting "Hi" 
        console.log('\n=== TEST 1: First Greeting "Hi" ===');
        const chatInput = page.locator('input[placeholder="שלח הודעה..."]');
        const sendButton = page.locator('button').filter({ hasText: /→|send/i });
        
        await chatInput.fill('Hi');
        await sendButton.click();
        await page.waitForTimeout(3000); // Wait for response
        await takeScreenshot('greeting-hi-first');
        
        // Capture first response (look for SweatBot's response in the messages area)
        const firstResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        addTest('First Hi greeting sent', !!firstResponse, `Response: ${firstResponse?.substring(0, 100)}...`);
        
        // Test 2: Second Greeting "Hi" (Critical - Check for Different Response)
        console.log('\n=== TEST 2: Second Greeting "Hi" (Hardcoding Check) ===');
        await page.waitForTimeout(2000); // Wait 2 seconds as specified
        await chatInput.fill('Hi');
        await sendButton.click();
        await page.waitForTimeout(3000);
        await takeScreenshot('greeting-hi-second');
        
        const secondResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const responsesDifferent = firstResponse !== secondResponse;
        addTest('Second Hi greeting produces different response', responsesDifferent, 
            `First: "${firstResponse?.substring(0, 50)}..." | Second: "${secondResponse?.substring(0, 50)}..."`);
        
        // Test 3: Hebrew Greeting
        console.log('\n=== TEST 3: Hebrew Greeting "שלום" ===');
        await chatInput.fill('שלום');
        await sendButton.click();
        await page.waitForTimeout(3000);
        await takeScreenshot('greeting-hebrew');
        
        const hebrewResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        addTest('Hebrew greeting responded to', !!hebrewResponse, `Response: ${hebrewResponse?.substring(0, 100)}...`);
        
        // Test 4: Check for UI Components after greetings
        console.log('\n=== TEST 4: Check No Quick Action Buttons After Greetings ===');
        const quickActionButtons = await page.locator('button').filter({ hasText: /quick|action|תרגיל|סטטיסטיקה/i }).count();
        const uiComponents = await page.locator('[class*="quick"], [class*="action"], [class*="button-group"]').count();
        addTest('No quick action buttons after greetings', quickActionButtons === 0 && uiComponents === 0, 
            `Found ${quickActionButtons} quick action buttons, ${uiComponents} UI components`);
        
        // Test 5: Non-Fitness Question (English)
        console.log('\n=== TEST 5: Non-Fitness Question "What time is it?" ===');
        await chatInput.fill('What time is it?');
        await sendButton.click();
        await page.waitForTimeout(3000);
        await takeScreenshot('non-fitness-english');
        
        const timeResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const politelyDeclined = timeResponse?.toLowerCase().includes('fitness') || 
                                timeResponse?.toLowerCase().includes('workout') ||
                                timeResponse?.includes('לא יכול') ||
                                timeResponse?.toLowerCase().includes('help with fitness');
        addTest('Non-fitness question politely declined (English)', politelyDeclined, `Response: ${timeResponse?.substring(0, 100)}...`);
        
        // Test 6: Non-Fitness Question (Hebrew)
        console.log('\n=== TEST 6: Non-Fitness Question "מה השעה?" ===');
        await chatInput.fill('מה השעה?');
        await sendButton.click();
        await page.waitForTimeout(3000);
        await takeScreenshot('non-fitness-hebrew');
        
        const hebrewTimeResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const hebrewPolitelyDeclined = hebrewTimeResponse?.includes('כושר') || 
                                      hebrewTimeResponse?.includes('אימון') ||
                                      hebrewTimeResponse?.includes('לא יכול') ||
                                      hebrewTimeResponse?.toLowerCase().includes('fitness');
        addTest('Non-fitness question politely declined (Hebrew)', hebrewPolitelyDeclined, `Response: ${hebrewTimeResponse?.substring(0, 100)}...`);
        
        // Test 7: Fitness Exercise Logging
        console.log('\n=== TEST 7: Fitness Exercise Logging "עשיתי 20 סקוואטים" ===');
        await chatInput.fill('עשיתי 20 סקוואטים');
        await sendButton.click();
        await page.waitForTimeout(4000); // Extra time for backend processing
        await takeScreenshot('exercise-logging');
        
        const exerciseResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const exerciseLogged = exerciseResponse?.includes('20') || 
                              exerciseResponse?.includes('סקוואט') ||
                              exerciseResponse?.includes('נקודות') ||
                              exerciseResponse?.toLowerCase().includes('logged');
        addTest('Exercise logging works', exerciseLogged, `Response: ${exerciseResponse?.substring(0, 100)}...`);
        
        // Test 8: Statistics Retrieval
        console.log('\n=== TEST 8: Statistics Retrieval "Show me my stats" ===');
        await chatInput.fill('Show me my stats');
        await sendButton.click();
        await page.waitForTimeout(4000);
        await takeScreenshot('stats-retrieval');
        
        const statsResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const statsRetrieved = statsResponse?.toLowerCase().includes('points') || 
                              statsResponse?.includes('נקודות') ||
                              statsResponse?.toLowerCase().includes('stats') ||
                              statsResponse?.toLowerCase().includes('exercise');
        addTest('Statistics retrieval works', statsRetrieved, `Response: ${statsResponse?.substring(0, 100)}...`);
        
        // Test 9: CRITICAL - Hebrew Rope Climb Exercise (Previously Failing)
        console.log('\n=== TEST 9: Hebrew Rope Climb "עשיתי 4 טיפוסי חבל" ===');
        await chatInput.fill('עשיתי 4 טיפוסי חבל');
        await sendButton.click();
        await page.waitForTimeout(5000); // Extra time for processing
        await takeScreenshot('hebrew-rope-climb');
        
        const ropeResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const ropeLogged = ropeResponse?.includes('4') && 
                          (ropeResponse?.includes('טיפוסי חבל') || ropeResponse?.includes('חבל')) &&
                          (ropeResponse?.includes('רשמתי') || ropeResponse?.includes('נרשם')) &&
                          ropeResponse?.includes('כל הכבוד');
        addTest('Hebrew Rope Climb Exercise Logged', ropeLogged, `Response: ${ropeResponse?.substring(0, 100)}...`);
        
        // Test 10: Hebrew Exercise with Date Format (Previously Failing)
        console.log('\n=== TEST 10: Hebrew Exercise with Date "אתמול 24.8 - 4 טיפוסי חבל" ===');
        await chatInput.fill('אתמול 24.8 - 4 טיפוסי חבל');
        await sendButton.click();
        await page.waitForTimeout(5000);
        await takeScreenshot('hebrew-date-exercise');
        
        const dateResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const dateLogged = dateResponse?.includes('4') && 
                          (dateResponse?.includes('טיפוסי חבל') || dateResponse?.includes('חבל')) &&
                          (dateResponse?.includes('רשמתי') || dateResponse?.includes('נרשם'));
        addTest('Hebrew Exercise with Date Format', dateLogged, `Response: ${dateResponse?.substring(0, 100)}...`);
        
        // Test 11: Conversation Memory
        console.log('\n=== TEST 11: Conversation Memory "How many points do I have?" ===');
        await chatInput.fill('How many points do I have?');
        await sendButton.click();
        await page.waitForTimeout(4000);
        await takeScreenshot('conversation-memory');
        
        const memoryResponse = await page.locator('div[class*="max-w-xs"] div, div[class*="max-w-md"] div').last().textContent();
        const memoryWorks = memoryResponse?.toLowerCase().includes('points') || 
                           memoryResponse?.includes('נקודות') ||
                           memoryResponse?.includes('20') || // Reference to previous exercise
                           memoryResponse?.toLowerCase().includes('squat');
        addTest('Conversation memory works', memoryWorks, `Response: ${memoryResponse?.substring(0, 100)}...`);
        
        // Final screenshot
        await takeScreenshot('final-state');
        
    } catch (error) {
        console.error('Test execution error:', error);
        addTest('Test execution', false, `Error: ${error.message}`);
    }
    
    await browser.close();
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('🧪 SWEATBOT E2E TEST SUMMARY');
    console.log('='.repeat(60));
    
    const passedTests = results.tests.filter(t => t.passed).length;
    const totalTests = results.tests.length;
    
    console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests} tests`);
    console.log(`📸 Screenshots: ${results.screenshots.length} taken`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ALL TESTS PASSED! SweatBot is working correctly.');
    } else {
        console.log('\n⚠️ SOME TESTS FAILED. Review the details above.');
    }
    
    results.tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`${status} Test ${test.number}: ${test.name}`);
        if (test.details) console.log(`   ${test.details}`);
    });
    
    // Save results to JSON
    fs.writeFileSync('sweatbot-e2e-results.json', JSON.stringify(results, null, 2));
    console.log('\n📊 Full test results saved to: sweatbot-e2e-results.json');
    
    return results;
}

// Run the test
runSweatBotE2ETest().catch(console.error);