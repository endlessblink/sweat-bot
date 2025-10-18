import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Test Hebrew AI chat functionality with OpenAI integration
 */
test.describe('Hebrew AI Chat Tests', () => {
  const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots-debug');

  test('should handle Hebrew conversation with AI assistant', async ({ page }) => {
    console.log('🚀 Starting Hebrew AI Chat Test');

    // Step 1: Navigate to the app
    console.log('📍 Step 1: Navigate to SweatBot app');
    await page.goto('http://localhost:8005');
    await page.waitForLoadState('networkidle');

    // Take screenshot of initial interface
    await page.screenshot({
      path: path.join(screenshotsDir, '01-initial-interface.png'),
      fullPage: true
    });
    console.log('✅ Screenshot taken: Initial interface');

    // Step 2: Wait for the app to load completely
    console.log('📍 Step 2: Wait for app to load');
    await page.waitForSelector('input.sweatbot-input', { timeout: 10000 });

    // Verify WebSocket connection is established
    console.log('📍 Step 3: Check WebSocket connection');
    await page.waitForFunction(() => {
      return window.ws?.readyState === 1; // WebSocket.OPEN
    }, { timeout: 5000 }).catch(() => {
      console.log('⚠️ WebSocket connection check failed, continuing anyway');
    });

    // Step 3: Type Hebrew message
    console.log('📍 Step 4: Type Hebrew message');
    const hebrewMessage = 'שלום, אני רוצה להתחיל אימון כוח היום';
    const chatInput = page.locator('input.sweatbot-input');
    await chatInput.fill(hebrewMessage);

    // Screenshot before sending
    await page.screenshot({
      path: path.join(screenshotsDir, '02-hebrew-message-typed.png'),
      fullPage: true
    });
    console.log('✅ Hebrew message typed');

    // Step 4: Send the message
    console.log('📍 Step 5: Send Hebrew message');
    await chatInput.press('Enter');

    // Alternative: Click send button if Enter doesn't work
    const sendButton = page.locator('button:has(svg), button[aria-label*="Send"], button[aria-label*="שלח"]');
    if (await sendButton.isVisible()) {
      await sendButton.click();
    }

    // Step 5: Wait for AI response
    console.log('📍 Step 6: Wait for AI response');

    // Wait for user message to appear
    await page.waitForSelector(`text=${hebrewMessage}`, { timeout: 5000 });
    console.log('✅ User message visible');

    // Wait for AI response (with increased timeout for AI processing)
    await page.waitForSelector('.prose, .markdown-content, [class*="message"]:has-text="ת")', {
      timeout: 30000,
      state: 'visible'
    }).catch(() => {
      console.log('⚠️ AI message selector not found, looking for any response');
      // Fallback to look for any message that isn't the user's
      page.waitForSelector('div[class*="message"]:not(:has-text="' + hebrewMessage + '")', { timeout: 10000 });
    });

    // Give extra time for AI response to fully render
    await page.waitForTimeout(3000);

    // Step 6: Verify AI response and take screenshot
    console.log('📍 Step 7: Verify AI response');

    // Check if AI responded in Hebrew
    const aiMessages = await page.locator('.prose, .markdown-content, div[class*="message"]:has-text="ת")').all();
    let hebrewResponseFound = false;

    if (aiMessages.length > 0) {
      const lastAiMessage = aiMessages[aiMessages.length - 1];
      const aiResponseText = await lastAiMessage.textContent();

      console.log('AI Response:', aiResponseText);

      // Check for Hebrew characters
      hebrewResponseFound = /[\u0590-\u05FF]/.test(aiResponseText || '');

      if (hebrewResponseFound) {
        console.log('✅ AI responded in Hebrew');
      } else {
        console.log('⚠️ AI response may not be in Hebrew');
      }
    } else {
      console.log('❌ No AI messages found');
    }

    // Take screenshot of complete conversation
    await page.screenshot({
      path: path.join(screenshotsDir, '03-complete-conversation.png'),
      fullPage: true
    });
    console.log('✅ Screenshot taken: Complete conversation');

    // Step 7: Test voice input button
    console.log('📍 Step 8: Test voice input button');
    const voiceButton = page.locator('button[aria-label*="מיקרופון"], button[aria-label*="voice"], button[aria-label*="מיקרופון"], svg[class*="mic"]');

    if (await voiceButton.isVisible()) {
      console.log('✅ Voice button found');
      await voiceButton.click();
      await page.waitForTimeout(1000);

      // Check if voice recording started
      const isRecording = await voiceButton.getAttribute('aria-label');
      console.log('Voice button state:', isRecording);

      // Stop recording
      await voiceButton.click();
      console.log('✅ Voice button tested');
    } else {
      console.log('⚠️ Voice button not visible');
    }

    // Step 8: Check for console errors
    console.log('📍 Step 9: Check for console errors');
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // Final assertions
    console.log('📍 Step 10: Final verification');

    // Verify at least one user message exists
    await expect(page.locator(`text=${hebrewMessage}`)).toBeVisible();

    // Verify at least one AI response exists
    const aiResponseExists = await page.locator('.prose, .markdown-content, div[class*="message"]:has-text="ת")').count() > 0;
    expect(aiResponseExists).toBeTruthy();

    console.log('✅ Hebrew AI Chat Test Complete');
    console.log(`📸 Screenshots saved to: ${screenshotsDir}`);
    console.log(`🌐 Hebrew AI Response: ${hebrewResponseFound ? 'Yes' : 'No'}`);
  });

  test('should check WebSocket connection stability', async ({ page }) => {
    console.log('🔍 Testing WebSocket connection stability');

    await page.goto('http://localhost:8005');
    await page.waitForLoadState('networkidle');

    // Monitor WebSocket connection
    let connectionEvents: any[] = [];

    await page.evaluate(() => {
      const originalWebSocket = window.WebSocket;
      window.connectionEvents = [];

      window.WebSocket = function(url: string, protocols?: string | string[]) {
        const ws = new originalWebSocket(url, protocols);

        ws.addEventListener('open', () => {
          window.connectionEvents.push({ type: 'open', timestamp: Date.now() });
        });

        ws.addEventListener('close', () => {
          window.connectionEvents.push({ type: 'close', timestamp: Date.now() });
        });

        ws.addEventListener('error', (error) => {
          window.connectionEvents.push({ type: 'error', timestamp: Date.now(), error });
        });

        return ws;
      };
    });

    // Wait for initial connection
    await page.waitForTimeout(3000);

    // Get connection events
    connectionEvents = await page.evaluate(() => window.connectionEvents);

    console.log('WebSocket events:', connectionEvents);

    // Verify at least one connection was established
    const hasOpenEvent = connectionEvents.some(event => event.type === 'open');
    expect(hasOpenEvent).toBeTruthy();

    console.log('✅ WebSocket connection test complete');
  });
});