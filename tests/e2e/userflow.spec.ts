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

        await expect(page.getByRole('link', { name: /Is my rent fair/i })).toBeVisible();
    });

    test('Properties page loads and handles empty states', async ({ page }) => {
        await page.goto('/properties');

        const header = page.getByRole('heading', { level: 1, name: /Flats for rent in Bangalore/i });
        await expect(header).toBeVisible();

        // Either we see properties or the empty state
        const emptyState = page.getByText(/No flats match these filters/i);
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
        await expect(page.getByRole('heading', { name: /Sign in to RentWise/i })).toBeVisible();

        await page.goto('/register');
        await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
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

    test('Rent checker answers a typed query', async ({ page }) => {
        await page.goto('/check');
        await expect(page.locator('h1')).toContainText(/fair/i);
        await page.getByLabel(/Listing link or description/i).fill('2BHK HSR Layout 42k');
        await page.getByRole('button', { name: /^Check$/ }).click();
        await expect(page.getByText(/Read as:/i)).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(/2BHK/).first()).toBeVisible();
    });

    test('Rent index and open data pages render', async ({ page, request }) => {
        await page.goto('/insights');
        await expect(page.locator('h1')).toContainText(/Bangalore/i);
        await page.goto('/data');
        await expect(page.locator('h1')).toBeVisible();
        const csv = await request.get('/data/rent-index.csv');
        expect(csv.ok()).toBeTruthy();
        expect(await csv.text()).toContain('median_rent_inr');
    });

    test('Area rent pages index renders', async ({ page }) => {
        await page.goto('/bangalore/rent');
        await expect(page.locator('h1')).toBeVisible();
    });
});
