const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('Console:', msg.text().substring(0, 100)));
  
  await page.goto('http://localhost:8005');
  await new Promise(r => setTimeout(r, 2000));
  
  const input = await page.$('textarea, input[type="text"], [contenteditable="true"]');
  if (input) {
    await page.type('textarea, input[type="text"], [contenteditable="true"]', 'היי');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 3000));
  }
  
  await page.screenshot({ path: 'quick-test.png' });
  console.log('Screenshot saved');
  
  await browser.close();
})();