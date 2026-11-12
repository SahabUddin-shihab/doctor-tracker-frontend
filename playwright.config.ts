import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a LIVE stack (MongoDB + API + web) that already contains the seeded
 * administrator. See README "Testing". Configure with:
 *   E2E_BASE_URL        default http://localhost:3000
 *   E2E_ADMIN_EMAIL     default ADMIN_EMAIL from apps/api/.env.example
 *   E2E_ADMIN_PASSWORD
 *   PLAYWRIGHT_CHROMIUM_PATH  optional path to an existing Chromium (skips `playwright install`)
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // the workflow mutates shared data and asserts on dashboard totals
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
