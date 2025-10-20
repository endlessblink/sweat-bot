const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'cd personal-ui-vite && npm run dev',
      port: 8005,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd backend && doppler run --project sweatbot --config dev -- python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload',
      port: 8000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});