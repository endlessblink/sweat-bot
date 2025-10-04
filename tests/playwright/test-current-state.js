#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function takeScreenshot() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('provider') || text.includes('OpenAI') || text.includes('GPT') || 
          text.includes('Groq') || text.includes('initialized')) {
        console.log(`Console: ${text}`);
      }
    });

    console.log('Navigating to http://localhost:8005...');
    await page.goto('http://localhost:8005', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    console.log('Screenshot saved as current-state.png');
    
    // Try to find the chat input
    const hasInput = await page.evaluate(() => {
      const inputs = document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]');
      return inputs.length > 0;
    });
    
    console.log('Chat input found:', hasInput);
    
    if (hasInput) {
      // Send a test message
      const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
      await page.type(inputSelector, 'היי');
      await page.keyboard.press('Enter');
      console.log('Sent test message: היי');
      
      await new Promise(r => setTimeout(r, 3000));
      await page.screenshot({ path: 'after-message.png', fullPage: true });
      console.log('Screenshot saved as after-message.png');
      
      // Get response
      const messages = await page.evaluate(() => {
        const msgs = document.querySelectorAll('[class*="message"], [class*="bubble"], [class*="text"], p, div');
        return Array.from(msgs).map(el => el.textContent?.trim()).filter(text => text && text.length > 10);
      });
      
      console.log('\nMessages found:');
      messages.forEach(msg => {
        if (msg.length < 200) {
          console.log(`  - ${msg}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

takeScreenshot().catch(console.error);