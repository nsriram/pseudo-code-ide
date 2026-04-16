import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173'

// When targeting the deployed app the default 30 s timeout is too short for
// cold-start latency on the free Render tier.  A 60 s action timeout gives
// the first navigation enough time to wake the instance.
const isRemote = baseURL.startsWith('https://')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: isRemote ? 1 : 0,  // one retry on the deployed app for transient timeouts
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    actionTimeout: isRemote ? 60_000 : 10_000,
    navigationTimeout: isRemote ? 60_000 : 15_000,
  },
  expect: {
    timeout: isRemote ? 30_000 : 5_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // webServer is only used locally (not in CI — Docker manages the server there)
  ...(process.env.CI || isRemote
    ? {}
    : {
        webServer: {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: true,
        },
      }),
})
