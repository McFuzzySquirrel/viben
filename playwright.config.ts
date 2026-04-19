import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'capture-screenshots.spec.ts',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 800 },
    colorScheme: 'dark',
  },
  projects: [
    {
      name: 'screenshots',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
    {
      name: 'screenshots-mobile',
      use: {
        ...devices['iPhone 14'],
        browserName: 'chromium',
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
