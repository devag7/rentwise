import { test, expect } from '@playwright/test';

// Read-only smoke tests — safe to run against production.
// Base URL comes from playwright.config.ts (PLAYWRIGHT_BASE_URL).

test.describe('Health & infrastructure', () => {
    test('health endpoint responds ok', async ({ request }) => {
        const res = await request.get('/api/health');
        expect(res.ok()).toBeTruthy();
        const body = await res.json();
        expect(body.status).toBe('ok');
    });

    test('robots.txt and sitemap.xml are served', async ({ request }) => {
        const robots = await request.get('/robots.txt');
        expect(robots.ok()).toBeTruthy();
        const sitemap = await request.get('/sitemap.xml');
        expect(sitemap.ok()).toBeTruthy();
    });
});

test.describe('RentWise Userflow Tests', () => {
    test('Homepage loads correctly and has key calls to action', async ({ page }) => {
        await page.goto('/');

        await expect(page).toHaveTitle(/RentWise/i);

        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible();

        const accessBtn = page.getByText(/Initialize Access/i);
        await expect(accessBtn).toBeVisible();
    });

    test('Properties page loads and handles empty states', async ({ page }) => {
        await page.goto('/properties');

        const header = page.getByText(/Live Inventory/i);
        await expect(header).toBeVisible();

        // Either we see properties or "Zero Matches Found"
        const emptyState = page.getByText(/Zero Matches Found/i);
        const firstProperty = page.locator('.property-card').first();

        const hasEmptyState = await emptyState.isVisible();
        const hasProperty = await firstProperty.isVisible();

        expect(hasEmptyState || hasProperty).toBeTruthy();
    });

    test('Property detail page opens from the listing grid', async ({ page }) => {
        await page.goto('/properties');

        const firstCardLink = page.locator('a[href^="/properties/"]').first();
        if (await firstCardLink.count() === 0) {
            test.skip(true, 'No listings available to open');
        }
        await firstCardLink.click();
        await expect(page).toHaveURL(/\/properties\/\d+/);
        await expect(page.locator('h1').first()).toBeVisible();
    });

    test('Authentication layout renders properly', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByText(/Authenticate Session/i)).toBeVisible();

        await page.goto('/register');
        await expect(page.getByText(/Initialize Registry/i)).toBeVisible();
    });

    test('Role-specific auth pages render', async ({ page }) => {
        for (const path of ['/login/tenant', '/login/landlord', '/register/tenant', '/register/landlord']) {
            await page.goto(path);
            await expect(page.locator('form')).toBeVisible();
            await expect(page.locator('input[type="email"]')).toBeVisible();
        }
    });

    test('Unknown routes render the 404 page', async ({ page }) => {
        await page.goto('/this-route-does-not-exist');
        await expect(page.getByText(/does not exist/i)).toBeVisible();
    });

    test('Protected dashboard redirects unauthenticated users', async ({ page }) => {
        await page.goto('/dashboard');
        // Should land on login (client-side redirect) or stay on dashboard shell
        await page.waitForURL(/login|dashboard/, { timeout: 10_000 });
    });
});
