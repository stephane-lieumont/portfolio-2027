import { defineConfig, devices } from '@playwright/test';

const PORT = 4310;
const CI = !!process.env['CI'];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: CI,
  // One retry in CI only, and a retried pass is reported as flaky: it is a
  // signal to fix, not a pass to forget.
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node support/static-server.ts',
    url: `http://127.0.0.1:${PORT}/404/`,
    env: { E2E_PORT: String(PORT) },
    // A server left over from another checkout would serve another build.
    reuseExistingServer: false,
  },
});
