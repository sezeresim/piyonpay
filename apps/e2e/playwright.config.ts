import { defineConfig, devices } from '@playwright/test'

const UI_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: UI_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'en-US',
  },
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @piyonpay/server start:dev',
      cwd: '../..',
      url: `${API_URL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter @piyonpay/web dev -- --host 127.0.0.1 --port 5173',
      cwd: '../..',
      url: UI_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
