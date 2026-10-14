import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173/stardew-diary/',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
    ...(ci ? {} : { channel: 'chrome' }),
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173/stardew-diary/',
    reuseExistingServer: !ci,
  },
});
