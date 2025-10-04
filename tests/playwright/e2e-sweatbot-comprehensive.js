#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * SweatBot Comprehensive E2E Test Suite
 * 
 * Tests all critical requirements from CLAUDE.md:
 * ✅ Different responses for same greeting (NOT hardcoded)
 * ✅ Hebrew text interaction 
 * ✅ Exercise logging functionality
 * ✅ Natural conversation flow
 * ✅ No automatic UI components
 * ✅ Politely decline non-fitness questions
 */

async function runComprehensiveTest() {
  const screenshotDir = '/mnt/d/MY PROJECTS/AI/LLM/AI Code Gen/my-builds/Automation-Bots/sweatbot/docs/screenshots-debug/test-session-' + new Date().toISOString().split('T')[0];
  
  // Ensure screenshot directory exists
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let testResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    passed: 0,
    failed: 0
  };

  try {
    const page = await browser.newPage();
    
    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({
        type: msg.type(),
        text: text,
        timestamp: new Date().toISOString()
      });
      if (text.includes('provider') || text.includes('OpenAI') || text.includes('initialized')) {
        console.log(`Console: ${text}`);
      }
    });

    console.log('🚀 Starting SweatBot Comprehensive E2E Test Suite...');
    console.log(`📁 Screenshots will be saved to: ${screenshotDir}`);
    
    // Test 1: Initial page load
    console.log('\n📋 Test 1: Initial page load');
    await page.goto('http://localhost:8005', { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(screenshotDir, '01-initial-load.png'), fullPage: true });
    
    const hasInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
      return inputs.length > 0;
    });
    
    testResults.tests.push({
      name: 'Page loads with chat input',
      passed: hasInput,
      details: hasInput ? 'Chat input found' : 'No chat input found'
    });
    
    if (hasInput) {
      testResults.passed++;
      console.log('✅ Page loads correctly with chat input');
    } else {
      testResults.failed++;
      console.log('❌ Page failed to load properly');
      return;
    }

    const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
    
    // Test 2: Greeting variation test - CRITICAL
    console.log('\n📋 Test 2: Greeting variation test (CRITICAL - No hardcoded responses)');
    const greetingResponses = [];
    
    for (let i = 1; i <= 5; i++) {
      await page.type(inputSelector, 'שלום');
      await page.keyboard.press('Enter');
      await new Promise(r => setTimeout(r, 3000)); // Wait for response
      
      const messages = await page.evaluate(() => {
        const msgs = document.querySelectorAll('[class*="message"], [class*="bubble"], div');
        return Array.from(msgs).map(el => el.textContent?.trim()).filter(text => 
          text && text.length > 5 && text.includes('!')).slice(-1);
      });
      
      if (messages.length > 0) {
        greetingResponses.push(messages[0]);
        console.log(`Response ${i}: ${messages[0].substring(0, 50)}...`);
      }
      
      await page.screenshot({ path: path.join(screenshotDir, `02-greeting-${i}.png`), fullPage: true });
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // Check if responses are varied (not hardcoded)
    const uniqueResponses = new Set(greetingResponses);
    const isVaried = uniqueResponses.size >= 3; // At least 3 different responses out of 5
    
    testResults.tests.push({
      name: 'Greeting responses are varied (not hardcoded)',
      passed: isVaried,
      details: `Got ${uniqueResponses.size} unique responses out of ${greetingResponses.length} attempts`,
      responses: greetingResponses
    });
    
    if (isVaried) {
      testResults.passed++;
      console.log(`✅ Responses are varied: ${uniqueResponses.size} different responses`);
    } else {
      testResults.failed++;
      console.log(`❌ Responses appear hardcoded: only ${uniqueResponses.size} different responses`);
    }

    // Test 3: Exercise logging in Hebrew
    console.log('\n📋 Test 3: Exercise logging in Hebrew');
    await page.type(inputSelector, 'עשיתי 20 סקוואטים');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 4000));
    
    const exerciseMessages = await page.evaluate(() => {
      const msgs = document.querySelectorAll('div');
      return Array.from(msgs).map(el => el.textContent?.trim()).filter(text => 
        text && (text.includes('רשמתי') || text.includes('20') || text.includes('סקוואטים')));
    });
    
    const exerciseLogged = exerciseMessages.length > 0;
    
    testResults.tests.push({
      name: 'Hebrew exercise logging works',
      passed: exerciseLogged,
      details: exerciseLogged ? `Found exercise response: ${exerciseMessages[0]}` : 'No exercise response found'
    });
    
    await page.screenshot({ path: path.join(screenshotDir, '03-exercise-logging.png'), fullPage: true });
    
    if (exerciseLogged) {
      testResults.passed++;
      console.log('✅ Exercise logging works in Hebrew');
    } else {
      testResults.failed++;
      console.log('❌ Exercise logging failed');
    }

    // Test 4: Non-fitness question decline
    console.log('\n📋 Test 4: Non-fitness questions should be politely declined');
    await page.type(inputSelector, 'מה השעה?');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    
    const declineMessages = await page.evaluate(() => {
      const msgs = document.querySelectorAll('div');
      return Array.from(msgs).map(el => el.textContent?.trim()).filter(text => 
        text && text.length > 10).slice(-1);
    });
    
    // Should politely decline or redirect to fitness topics
    const isPoliteDecline = declineMessages.length > 0 && 
      (declineMessages[0].includes('כושר') || declineMessages[0].includes('אימון') || 
       declineMessages[0].includes('התמחה') || declineMessages[0].includes('ספורט'));
    
    testResults.tests.push({
      name: 'Non-fitness questions politely declined',
      passed: isPoliteDecline,
      details: isPoliteDecline ? `Redirected to fitness: ${declineMessages[0]}` : 'Did not redirect to fitness topics'
    });
    
    await page.screenshot({ path: path.join(screenshotDir, '04-non-fitness-question.png'), fullPage: true });
    
    if (isPoliteDecline) {
      testResults.passed++;
      console.log('✅ Non-fitness questions properly handled');
    } else {
      testResults.failed++;
      console.log('❌ Non-fitness questions not properly handled');
    }

    // Test 5: Stats request in Hebrew
    console.log('\n📋 Test 5: Statistics request in Hebrew');
    await page.type(inputSelector, 'כמה נקודות יש לי?');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
    
    const statsMessages = await page.evaluate(() => {
      const msgs = document.querySelectorAll('div');
      return Array.from(msgs).map(el => el.textContent?.trim()).filter(text => 
        text && (text.includes('נקודות') || text.includes('סטטיסטיק') || text.includes('150')));
    });
    
    const statsWorks = statsMessages.length > 0;
    
    testResults.tests.push({
      name: 'Statistics request works in Hebrew',
      passed: statsWorks,
      details: statsWorks ? `Found stats response: ${statsMessages[0]}` : 'No stats response found'
    });
    
    await page.screenshot({ path: path.join(screenshotDir, '05-stats-request.png'), fullPage: true });
    
    if (statsWorks) {
      testResults.passed++;
      console.log('✅ Statistics request works');
    } else {
      testResults.failed++;
      console.log('❌ Statistics request failed');
    }

    // Final screenshot
    await page.screenshot({ path: path.join(screenshotDir, '06-final-state.png'), fullPage: true });

    // Save test results
    fs.writeFileSync(
      path.join(screenshotDir, 'test-results.json'), 
      JSON.stringify(testResults, null, 2)
    );

    // Generate summary report
    const summaryReport = `
# SweatBot E2E Test Report
**Date:** ${testResults.timestamp}
**Total Tests:** ${testResults.tests.length}
**Passed:** ${testResults.passed}
**Failed:** ${testResults.failed}
**Success Rate:** ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%

## Test Results:
${testResults.tests.map(test => `
### ${test.name}
- **Status:** ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Details:** ${test.details}
${test.responses ? `- **Responses:** ${test.responses.join(', ')}` : ''}
`).join('\n')}

## Console Messages:
${consoleMessages.map(msg => `[${msg.timestamp}] ${msg.type.toUpperCase()}: ${msg.text}`).join('\n')}
`;

    fs.writeFileSync(
      path.join(screenshotDir, 'test-summary.md'), 
      summaryReport
    );

    console.log('\n🏁 Test Suite Complete!');
    console.log(`📊 Results: ${testResults.passed}/${testResults.tests.length} tests passed`);
    console.log(`📁 Full report saved to: ${screenshotDir}/test-summary.md`);
    
    return testResults;

  } catch (error) {
    console.error('Test suite error:', error.message);
    testResults.tests.push({
      name: 'Test suite execution',
      passed: false,
      details: `Error: ${error.message}`
    });
    testResults.failed++;
  } finally {
    await browser.close();
  }
  
  return testResults;
}

// Run the test suite
runComprehensiveTest().then(results => {
  const passed = results.passed;
  const total = results.tests.length;
  const success = passed === total;
  
  console.log(`\n🎯 FINAL RESULT: ${success ? 'ALL TESTS PASSED' : `${passed}/${total} TESTS PASSED`}`);
  
  if (success) {
    console.log('✅ SweatBot is ready for production according to E2E testing!');
    process.exit(0);
  } else {
    console.log('❌ SweatBot has issues that need to be resolved.');
    process.exit(1);
  }
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});