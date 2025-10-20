---
name: E2E Testing Automation
description: Comprehensive end-to-end testing automation using Playwright, API testing, visual regression, and performance monitoring. Use when setting up automated testing suites or debugging application issues.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

# E2E Testing Automation

## Overview

Technical skill for comprehensive end-to-end testing automation including browser testing with Playwright, API testing, visual regression testing, and performance monitoring.

## When to Use

- Setting up automated testing infrastructure
- Creating test suites for web applications
- Implementing API testing and validation
- Running visual regression tests
- Performance testing and monitoring
- Debugging application issues

## Technical Capabilities

1. **Browser Automation**: Playwright-based UI testing
2. **API Testing**: REST API endpoint validation
3. **Visual Testing**: Screenshot comparison and visual regression
4. **Performance Testing**: Load testing and performance metrics
5. **Test Data Management**: Dynamic test data generation and cleanup

## Playwright Testing Setup

### Installation and Configuration
```bash
# Install Playwright
npm install --save-dev @playwright/test
npx playwright install

# Install additional dependencies
npm install --save-dev @playwright/test expect axios dotenv
```

### Playwright Configuration
```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    }
  ],
  webServer: {
    command: process.env.CI ? '' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Test Base Class
```typescript
// tests/helpers/test-base.ts

import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { APIHelper } from './api-helper';
import { TestDataGenerator } from './test-data-generator';

export class TestBase {
  public page: Page;
  public context: BrowserContext;
  public api: APIHelper;
  public testData: TestDataGenerator;

  constructor(page: Page, context: BrowserContext) {
    this.page = page;
    this.context = context;
    this.api = new APIHelper(process.env.API_BASE_URL);
    this.testData = new TestDataGenerator();
  }

  async login(username?: string, password?: string) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="username"]', username || 'testuser');
    await this.page.fill('[data-testid="password"]', password || 'testpass');
    await this.page.click('[data-testid="login-button"]');
    await this.page.waitForURL('/dashboard');
  }

  async navigateTo(path: string) {
    await this.page.goto(path);
  }

  async waitForElement(selector: string, timeout = 5000) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async clickElement(selector: string) {
    await this.page.click(selector);
  }

  async fillInput(selector: string, value: string) {
    await this.page.fill(selector, value);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  async verifyElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async verifyElementText(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  async verifyUrl(expectedUrl: string) {
    await expect(this.page).toHaveURL(expectedUrl);
  }
}

// Extend test fixture
export const testWithBase = test.extend<{
  testBase: TestBase;
}>({
  testBase: async ({ page, context }, use) => {
    const testBase = new TestBase(page, context);
    await use(testBase);
  },
});
```

### API Testing Helper
```typescript
// tests/helpers/api-helper.ts

import axios, { AxiosResponse } from 'axios';

export interface APIResponse {
  status: number;
  data: any;
  headers: any;
}

export class APIHelper {
  constructor(private baseURL: string) {}

  private async makeRequest(method: string, endpoint: string, data?: any): Promise<APIResponse> {
    try {
      const response: AxiosResponse = await axios({
        method,
        url: `${this.baseURL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error: any) {
      return {
        status: error.response?.status || 500,
        data: error.response?.data || error.message,
        headers: error.response?.headers || {},
      };
    }
  }

  async get(endpoint: string): Promise<APIResponse> {
    return await this.makeRequest('GET', endpoint);
  }

  async post(endpoint: string, data: any): Promise<APIResponse> {
    return await this.makeRequest('POST', endpoint, data);
  }

  async put(endpoint: string, data: any): Promise<APIResponse> {
    return await this.makeRequest('PUT', endpoint, data);
  }

  async delete(endpoint: string): Promise<APIResponse> {
    return await this.makeRequest('DELETE', endpoint);
  }

  async assertStatus(response: APIResponse, expectedStatus: number) {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}. Response: ${JSON.stringify(response.data)}`
      );
    }
  }

  async assertResponseContains(response: APIResponse, expectedContent: string) {
    const responseStr = JSON.stringify(response.data);
    if (!responseStr.includes(expectedContent)) {
      throw new Error(
        `Expected response to contain "${expectedContent}". Got: ${responseStr}`
      );
    }
  }
}
```

### Test Data Generator
```typescript
// tests/helpers/test-data-generator.ts

import { faker } from '@faker-js/faker';

export class TestDataGenerator {
  private createdResources: any[] = [];

  generateUser() {
    return {
      username: faker.internet.userName(),
      email: faker.internet.email(),
      password: faker.internet.password(12),
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
    };
  }

  generateWorkout() {
    return {
      name: faker.helpers.arrayElement([
        'Morning Cardio', 'Upper Body Strength', 'Lower Body Power',
        'Full Body HIIT', 'Core Workout', 'Flexibility Training'
      ]),
      duration: faker.number.int({ min: 15, max: 60 }),
      difficulty: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
      equipment: faker.helpers.arrayElement(['bodyweight', 'dumbbells', 'resistance bands']),
    };
  }

  generateExercise() {
    return {
      name: faker.helpers.arrayElement([
        'Push-ups', 'Squats', 'Lunges', 'Planks', 'Burpees', 'Jumping Jacks'
      ]),
      sets: faker.number.int({ min: 1, max: 5 }),
      reps: faker.number.int({ min: 5, max: 30 }),
      weight: faker.helpers.maybe(() => faker.number.int({ min: 5, max: 50 })),
      notes: faker.lorem.sentence(),
    };
  }

  async createUser(apiHelper: APIHelper) {
    const userData = this.generateUser();

    const response = await apiHelper.post('/api/users', userData);
    apiHelper.assertStatus(response, 201);

    const user = { ...userData, id: response.data.id };
    this.createdResources.push({ type: 'user', id: user.id });

    return user;
  }

  async createWorkout(apiHelper: APIHelper, userId: string) {
    const workoutData = this.generateWorkout();

    const response = await apiHelper.post(`/api/users/${userId}/workouts`, workoutData);
    apiHelper.assertStatus(response, 201);

    const workout = { ...workoutData, id: response.data.id };
    this.createdResources.push({ type: 'workout', id: workout.id });

    return workout;
  }

  async cleanup(apiHelper: APIHelper) {
    // Cleanup in reverse order
    for (const resource of this.createdResources.reverse()) {
      try {
        if (resource.type === 'user') {
          await apiHelper.delete(`/api/users/${resource.id}`);
        } else if (resource.type === 'workout') {
          await apiHelper.delete(`/api/workouts/${resource.id}`);
        }
      } catch (error) {
        console.warn(`Failed to cleanup ${resource.type} ${resource.id}:`, error);
      }
    }

    this.createdResources = [];
  }
}
```

## Test Examples

### Critical User Journey Tests
```typescript
// tests/e2e/user-journey.spec.ts

import { testWithBase, TestBase } from '../helpers/test-base';

testWithBase.describe('User Journey Tests', () => {
  let testBase: TestBase;
  let userId: string;

  testWithBase.beforeAll(async ({ page, context }) => {
    testBase = new TestBase(page, context);
  });

  testWithBase('Complete user signup and first workout flow', async () => {
    // Navigate to signup
    await testBase.navigateTo('/signup');

    // Fill signup form
    const userData = testBase.testData.generateUser();
    await testBase.fillInput('[data-testid="email"]', userData.email);
    await testBase.fillInput('[data-testid="password"]', userData.password);
    await testBase.fillInput('[data-testid="confirmPassword"]', userData.password);
    await testBase.fillInput('[data-testid="firstName"]', userData.firstName);
    await testBase.fillInput('[data-testid="lastName"]', userData.lastName);

    // Submit signup
    await testBase.clickElement('[data-testid="signup-button"]');

    // Wait for dashboard
    await testBase.verifyUrl('/dashboard');
    await testBase.verifyElementVisible('[data-testid="welcome-message"]');

    // Create first workout
    await testBase.clickElement('[data-testid="create-workout-button"]');
    await testBase.clickElement('[data-testid="workout-template-quick-start"]');
    await testBase.fillInput('[data-testid="workout-name"]', 'My First Workout');
    await testBase.clickElement('[data-testid="save-workout-button"]');

    // Verify workout created
    await testBase.verifyElementVisible('[data-testid="workout-success-message"]');
    await testBase.takeScreenshot('first-workout-created');

    // Start workout
    await testBase.clickElement('[data-testid="start-workout-button"]');
    await testBase.verifyElementVisible('[data-testid="workout-timer"]');

    // Complete one exercise
    await testBase.verifyElementVisible('[data-testid="exercise-1"]');
    await testBase.clickElement('[data-testid="complete-exercise-button"]');

    // Finish workout
    await testBase.clickElement('[data-testid="finish-workout-button"]');
    await testBase.verifyElementVisible('[data-testid="workout-summary"]');
  });

  testWithBase('User can log exercise and view statistics', async () => {
    // Login
    await testBase.login();

    // Navigate to exercise logging
    await testBase.clickElement('[data-testid="nav-exercises"]');
    await testBase.verifyUrl('/exercises');

    // Log an exercise
    await testBase.clickElement('[data-testid="log-exercise-button"]');
    const exerciseData = testBase.testData.generateExercise();
    await testBase.fillInput('[data-testid="exercise-name"]', exerciseData.name);
    await testBase.fillInput('[data-testid="exercise-sets"]', exerciseData.sets.toString());
    await testBase.fillInput('[data-testid="exercise-reps"]', exerciseData.reps.toString());

    if (exerciseData.weight) {
      await testBase.fillInput('[data-testid="exercise-weight"]', exerciseData.weight.toString());
    }

    await testBase.clickElement('[data-testid="save-exercise-button"]');

    // Verify exercise logged
    await testBase.verifyElementVisible('[data-testid="exercise-logged-message"]');

    // Navigate to statistics
    await testBase.clickElement('[data-testid="nav-statistics"]');
    await testBase.verifyUrl('/statistics');

    // Verify statistics display
    await testBase.verifyElementVisible('[data-testid="stats-summary"]');
    await testBase.verifyElementVisible('[data-testid="recent-exercises"]');
  });
});
```

### API Integration Tests
```typescript
// tests/api/health-check.spec.ts

import { test, expect } from '@playwright/test';
import { APIHelper } from '../helpers/api-helper';

test.describe('API Health Checks', () => {
  let api: APIHelper;

  test.beforeAll(async () => {
    api = new APIHelper(process.env.API_BASE_URL || 'http://localhost:8000');
  });

  test('Health endpoint returns healthy status', async () => {
    const response = await api.get('/health');

    api.assertStatus(response, 200);
    expect(response.data).toHaveProperty('status', 'healthy');
    expect(response.data).toHaveProperty('timestamp');
  });

  test('Database health check passes', async () => {
    const response = await api.get('/health/database');

    api.assertStatus(response, 200);
    expect(response.data).toHaveProperty('postgres', 'connected');
    expect(response.data).toHaveProperty('mongodb', 'connected');
  });

  test('API endpoints respond correctly', async () => {
    const endpoints = [
      { path: '/api/v1/status', expectedStatus: 200 },
      { path: '/api/v1/users', expectedStatus: 401 }, // Unauthorized without auth
      { path: '/api/v1/exercises', expectedStatus: 401 },
    ];

    for (const endpoint of endpoints) {
      const response = await api.get(endpoint.path);
      api.assertStatus(response, endpoint.expectedStatus);
    }
  });
});
```

### Visual Regression Tests
```typescript
// tests/visual/visual-regression.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('Dashboard layout matches snapshot', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'testuser');
    await page.fill('[data-testid="password"]', 'testpass');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Exercise form layout is consistent', async ({ page }) => {
    await page.goto('/login');
    await page.login('testuser', 'testpass');
    await page.goto('/exercises/log');

    // Test with different form states
    await page.fill('[data-testid="exercise-name"]', 'Push-ups');
    await expect(page.locator('.exercise-form')).toHaveScreenshot('exercise-form-filled.png');

    await page.fill('[data-testid="exercise-sets"]', '3');
    await page.fill('[data-testid="exercise-reps"]', '15');
    await expect(page.locator('.exercise-form')).toHaveScreenshot('exercise-form-complete.png');
  });

  test('Mobile responsive layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/login');
    await page.login('testuser', 'testpass');
    await page.waitForURL('/dashboard');

    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
    });
  });
});
```

### Performance Tests
```typescript
// tests/performance/load-testing.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Page load times are within acceptable limits', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 seconds max load time

    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });

    expect(metrics.domContentLoaded).toBeLessThan(1500);
    expect(metrics.loadComplete).toBeLessThan(3000);
    expect(metrics.firstContentfulPaint).toBeLessThan(1000);
  });

  test('API response times are acceptable', async ({ page }) => {
    const responseTimes: number[] = [];

    // Monitor API calls
    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        const timing = response.request().timing();
        const responseTime = timing.responseEnd - timing.requestStart;
        responseTimes.push(responseTime);
      }
    });

    await page.goto('/dashboard');
    await page.click('[data-testid="nav-statistics"]');
    await page.waitForURL('/statistics');

    // Verify all API calls completed within acceptable time
    for (const responseTime of responseTimes) {
      expect(responseTime).toBeLessThan(2000); // 2 seconds max API response time
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    expect(avgResponseTime).toBeLessThan(1000); // 1 second average
  });
});
```

## Test Execution Scripts

### Local Testing Script
```bash
#!/bin/bash
# run-tests.sh

set -e

echo "🧪 Running E2E Tests..."

# Set environment variables
export NODE_ENV=test
export TEST_BASE_URL=${TEST_BASE_URL:-http://localhost:3000}
export API_BASE_URL=${API_BASE_URL:-http://localhost:8000}

# Start services if not running
if ! curl -s $API_BASE_URL/health > /dev/null; then
  echo "🚀 Starting backend server..."
  cd backend && npm run dev &
  BACKEND_PID=$!
  sleep 5
fi

if ! curl -s $TEST_BASE_URL > /dev/null; then
  echo "🚀 Starting frontend server..."
  cd frontend && npm run dev &
  FRONTEND_PID=$!
  sleep 5
fi

# Install dependencies
echo "📦 Installing test dependencies..."
npm ci

# Install browsers
echo "🌐 Installing browsers..."
npx playwright install

# Run tests
echo "✅ Running tests..."
npx playwright test --reporter=html

# Generate coverage report
echo "📊 Generating coverage report..."
npx nyc report --reporter=html

# Cleanup
if [ ! -z "$BACKEND_PID" ]; then
  kill $BACKEND_PID
fi

if [ ! -z "$FRONTEND_PID" ]; then
  kill $FRONTEND_PID
fi

echo "🎉 Tests completed! See results in playwright-report/index.html"
```

### CI/CD Testing Script
```bash
#!/bin/bash
# ci-tests.sh

set -e

echo "🚀 Running CI E2E Tests..."

# Install dependencies
npm ci

# Install browsers
npx playwright install --with-deps

# Start services
npm run start:test &
APP_PID=$!

# Wait for services to be ready
timeout 60 bash -c 'until curl -s http://localhost:3000 > /dev/null; do sleep 2; done'
timeout 60 bash -c 'until curl -s http://localhost:8000/health > /dev/null; do sleep 2; done'

# Run tests
npx playwright test --reporter=json --reporter=junit

# Upload results to reporting service
if [ "$CI" = "true" ]; then
  # Upload test results and screenshots
  curl -X POST \
    -H "Authorization: Bearer $REPORTING_TOKEN" \
    -F "results=@test-results/results.json" \
    -F "screenshots=@test-results/screenshots" \
    $REPORTING_URL
fi

# Cleanup
kill $APP_PID

echo "✅ CI tests completed successfully!"
```

### Test Data Management Script
```bash
#!/bin/bash
# test-data-manager.sh

set -e

ACTION=${1:-list}
ENV=${2:-test}

case $ACTION in
  "setup")
    echo "🔧 Setting up test data for $ENV environment..."

    # Reset test database
    if [ "$ENV" = "test" ]; then
      npm run db:reset:test
    fi

    # Seed test data
    npm run db:seed:test

    echo "✅ Test data setup complete"
    ;;

  "cleanup")
    echo "🧹 Cleaning up test data..."

    # Clear test database
    npm run db:clean:test

    # Remove test files
    rm -rf test-results/screenshots/*
    rm -rf test-results/videos/*

    echo "✅ Test data cleanup complete"
    ;;

  "list")
    echo "📋 Available test data environments:"
    echo "  - test: Development testing environment"
    echo "  - staging: Staging environment"
    echo "  - production: Production environment (read-only)"
    ;;

  *)
    echo "Usage: $0 [setup|cleanup|list] [test|staging|production]"
    exit 1
    ;;
esac
```

## Test Result Analysis

### Test Result Parser
```typescript
// scripts/analyze-test-results.ts

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  title: string;
  file: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  failures: TestResult[];
}

export class TestResultAnalyzer {
  analyzeTestResults(resultsPath: string): TestSummary {
    const resultsFile = readFileSync(resultsPath, 'utf8');
    const testData = JSON.parse(resultsFile);

    const summary: TestSummary = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: []
    };

    for (const spec of testData.suites) {
      for (const test of spec.specs) {
        summary.total++;
        summary.duration += test.duration;

        if (test.ok) {
          summary.passed++;
        } else if (test.tests?.every((t: any) => t.results?.[0]?.status === 'skipped')) {
          summary.skipped++;
        } else {
          summary.failed++;
          summary.failures.push({
            title: test.title,
            file: spec.file,
            status: 'failed',
            duration: test.duration,
            error: test.error?.message
          });
        }
      }
    }

    return summary;
  }

  generateReport(summary: TestSummary): string {
    const passRate = ((summary.passed / summary.total) * 100).toFixed(1);

    let report = `
🧪 Test Results Summary
=======================
Total Tests: ${summary.total}
✅ Passed: ${summary.passed}
❌ Failed: ${summary.failed}
⏭️  Skipped: ${summary.skipped}
📊 Pass Rate: ${passRate}%
⏱️  Duration: ${(summary.duration / 1000).toFixed(2)}s
`;

    if (summary.failures.length > 0) {
      report += `\n❌ Failed Tests:\n`;
      for (const failure of summary.failures) {
        report += `\n  - ${failure.title} (${failure.file})`;
        if (failure.error) {
          report += `\n    ${failure.error}`;
        }
      }
    }

    return report;
  }

  checkThresholds(summary: TestSummary): boolean {
    const MIN_PASS_RATE = 90; // 90% minimum pass rate
    const MAX_FAILURES = 5; // Maximum allowed failures

    const passRate = (summary.passed / summary.total) * 100;

    if (passRate < MIN_PASS_RATE) {
      console.error(`❌ Pass rate ${(passRate).toFixed(1)}% is below threshold ${MIN_PASS_RATE}%`);
      return false;
    }

    if (summary.failures > MAX_FAILURES) {
      console.error(`❌ ${summary.failures} failures exceed threshold ${MAX_FAILURES}`);
      return false;
    }

    return true;
  }
}

// CLI interface
if (require.main === module) {
  const analyzer = new TestResultAnalyzer();
  const resultsPath = process.argv[2] || 'test-results/results.json';

  try {
    const summary = analyzer.analyzeTestResults(resultsPath);
    const report = analyzer.generateReport(summary);

    console.log(report);

    const thresholdsMet = analyzer.checkThresholds(summary);
    process.exit(thresholdsMet ? 0 : 1);

  } catch (error) {
    console.error('Failed to analyze test results:', error);
    process.exit(1);
  }
}
```

This comprehensive e2e testing automation skill provides everything needed to implement robust testing infrastructure including browser automation, API testing, visual regression, performance monitoring, and test result analysis.