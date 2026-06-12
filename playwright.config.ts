import { defineConfig, devices } from '@playwright/test';

/**
 * E2E smoke suite. Targets the deployed droplet by default;
 * override with PLAYWRIGHT_BASE_URL (e.g. http://localhost:3000 in CI
 * against a local prod build).
 */
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 30_000,
    retries: process.env.CI ? 2 : 0,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://157.245.110.163:3009',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
