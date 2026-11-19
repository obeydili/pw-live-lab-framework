try {
  process.loadEnvFile('.env');
} catch {}

import { defineConfig, devices } from '@playwright/test';
import { env } from './helpers/env';

const appPort = new URL(env.BASE_URL).port || '3300';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    /* Signs in each account over the API and saves its session to playwright/.auth/. */
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: '**/*.spec.ts',
    },
  ],

  /* Starts Practice-App-v2 on the BASE_URL port, or reuses one that is already running (locally). */
  webServer: {
    command: 'npm --prefix practice-app-v2 start',
    url: `${env.BASE_URL}/api/health`,
    env: { PORT: appPort },
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
