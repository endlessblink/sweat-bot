const { chromium } = require('playwright');

async function testSweatBotProduction() {
    console.log('🚀 Starting SweatBot Production Comprehensive Test\n');

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });

    const page = await context.newPage();

    // Track console errors and network requests
    const consoleErrors = [];
    const networkErrors = [];
    const apiCalls = [];

    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log('🔴 Console Error:', msg.text());
        } else if (msg.type() === 'warning') {
            console.log('🟡 Console Warning:', msg.text());
        }
    });

    page.on('request', request => {
        const url = request.url();
        if (url.includes('sweat-bot.com') || url.includes('api')) {
            apiCalls.push({ method: request.method(), url, status: 'pending' });
        }
    });

    page.on('response', response => {
        const url = response.url();
        if (url.includes('sweat-bot.com') || url.includes('api')) {
            const status = response.status();
            const method = response.request().method();
            const apiCall = apiCalls.find(call => call.url === url);
            if (apiCall) {
                apiCall.status = status;
            }

            if (status >= 400) {
                networkErrors.push({ url, status, statusText: response.statusText() });
                console.log(`🔴 Network Error: ${status} ${response.statusText()} - ${url}`);
            } else {
                console.log(`✅ API Call: ${method} ${status} - ${url}`);
            }
        }
    });

    try {
        console.log('📍 Step 1: Navigating to https://sweat-bot.com');
        const startTime = Date.now();
        await page.goto('https://sweat-bot.com', { waitUntil: 'networkidle' });
        const loadTime = Date.now() - startTime;
        console.log(`⏱️  Page loaded in ${loadTime}ms`);

        // Check if page loaded successfully
        const title = await page.title();
        console.log(`📄 Page Title: "${title}"`);

        // Check for main content
        const mainContent = await page.locator('body').textContent();
        const hasContent = mainContent && mainContent.length > 100;
        console.log(`📝 Main Content Present: ${hasContent ? '✅ Yes' : '❌ No'}`);

        // Check for loading indicators or error messages
        const loadingIndicators = await page.locator('[class*="loading"], [class*="spinner"]').count();
        const errorMessages = await page.locator('[class*="error"], [class*="failed"]').count();
        console.log(`⏳ Loading Indicators: ${loadingIndicators}`);
        console.log(`❌ Error Messages: ${errorMessages}`);

        console.log('\n📍 Step 2: Checking UI Rendering and Design System');

        // Check for critical UI elements
        const criticalElements = [
            '.chat-container',
            '.message-input',
            '.send-button',
            '.workout-button',
            '[class*="chat"]',
            '[class*="message"]',
            '[class*="button"]'
        ];

        for (const selector of criticalElements) {
            const count = await page.locator(selector).count();
            if (count > 0) {
                console.log(`✅ Found ${count} element(s) with selector: ${selector}`);
            } else {
                console.log(`❌ No elements found with selector: ${selector}`);
            }
        }

        console.log('\n📍 Step 3: Testing Authentication Flow');

        // Look for guest user creation or login elements
        const guestButton = await page.locator('button:has-text("guest"), button:has-text("Guest"), button:has-text("התחל"), button:has-text("התחל לאימון")').first();
        const loginButton = await page.locator('button:has-text("login"), button:has-text("Login"), button:has-text("התחבר")').first();
        const startButton = await page.locator('button:has-text("start"), button:has-text("Start"), button:has-text("התחל")').first();

        if (await guestButton.isVisible()) {
            console.log('✅ Guest button found, clicking...');
            await guestButton.click();
            await page.waitForTimeout(2000);
        } else if (await startButton.isVisible()) {
            console.log('✅ Start button found, clicking...');
            await startButton.click();
            await page.waitForTimeout(2000);
        } else if (await loginButton.isVisible()) {
            console.log('✅ Login button found, clicking...');
            await loginButton.click();
            await page.waitForTimeout(2000);
        } else {
            console.log('⚠️  No authentication buttons found, looking for input fields...');
        }

        console.log('\n📍 Step 4: Testing Chat Functionality');

        // Look for message input
        const messageInput = await page.locator('input[type="text"], textarea, [contenteditable="true"], [class*="input"], [class*="message"]').first();

        if (await messageInput.isVisible()) {
            console.log('✅ Message input found, sending test message...');

            // Clear and send a test message
            await messageInput.clear();
            await messageInput.fill('Hello, I want to start working out');

            // Look for send button
            const sendButton = await page.locator('button:has-text("send"), button:has-text("Send"), button[aria-label*="send"], [class*="send"]').first();

            if (await sendButton.isVisible()) {
                console.log('✅ Send button found, clicking...');
                await sendButton.click();
            } else {
                console.log('⚠️  Send button not found, trying Enter key...');
                await messageInput.press('Enter');
            }

            // Wait for response
            await page.waitForTimeout(5000);

            // Check for response
            const responseElements = await page.locator('[class*="message"], [class*="response"], [class*="chat"]').count();
            console.log(`💬 Message elements after sending: ${responseElements}`);

            // Look for AI response indicators
            const aiResponse = await page.locator('text=/^(בטח|Sure|Great|Excellent|מצוין|בהחלט)/').first();
            if (await aiResponse.isVisible()) {
                console.log('✅ AI response detected!');
            } else {
                console.log('⚠️  No AI response detected');
            }
        } else {
            console.log('❌ No message input found');
        }

        console.log('\n📍 Step 5: Testing Workout Logging');

        // Look for workout buttons
        const workoutButtons = await page.locator('button:has-text("workout"), button:has-text("התאמן"), button:has-text("לחץ"), button:has-text("כפיפות")').all();

        if (workoutButtons.length > 0) {
            console.log(`✅ Found ${workoutButtons.length} workout buttons, testing one...`);
            await workoutButtons[0].click();
            await page.waitForTimeout(3000);

            // Check for any response or modal
            const modalElements = await page.locator('[class*="modal"], [class*="popup"], [class*="overlay"]').count();
            console.log(`🔄 Modal/Popup elements after workout click: ${modalElements}`);
        } else {
            console.log('⚠️  No workout buttons found');
        }

        console.log('\n📍 Step 6: Final State Check');

        // Check final page state
        const finalContent = await page.locator('body').textContent();
        const hasFinalContent = finalContent && finalContent.length > 500;
        console.log(`📝 Final Content Length: ${finalContent ? finalContent.length : 0} characters`);
        console.log(`📊 Content Present: ${hasFinalContent ? '✅ Yes' : '❌ No'}`);

        // Take screenshot for debugging
        await page.screenshot({ path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/production-test-' + Date.now() + '.png', fullPage: true });
        console.log('📸 Screenshot saved to debug directory');

    } catch (error) {
        console.error('💥 Test Error:', error.message);

        // Take screenshot on error
        await page.screenshot({ path: '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/production-error-' + Date.now() + '.png', fullPage: true });
    }

    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`🔴 Console Errors: ${consoleErrors.length}`);
    consoleErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));

    console.log(`🔴 Network Errors: ${networkErrors.length}`);
    networkErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error.status} ${error.statusText} - ${error.url}`));

    console.log(`📡 API Calls: ${apiCalls.length}`);
    const successfulCalls = apiCalls.filter(call => call.status < 400).length;
    const failedCalls = apiCalls.filter(call => call.status >= 400).length;
    console.log(`   ✅ Successful: ${successfulCalls}`);
    console.log(`   ❌ Failed: ${failedCalls}`);

    if (failedCalls > 0) {
        console.log('\n❌ Failed API Calls:');
        apiCalls.filter(call => call.status >= 400).forEach((call, i) => {
            console.log(`   ${i + 1}. ${call.method} ${call.status} - ${call.url}`);
        });
    }

    await browser.close();

    console.log('\n🏁 Test completed!');
}

testSweatBotProduction().catch(console.error);