import { test, expect } from '@playwright/test';

const BASE_URL = 'http://157.245.110.163:3009';

test.describe('RentWise Userflow Tests', () => {
  
  test('Homepage loads correctly and has key calls to action', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Verify title
    await expect(page).toHaveTitle(/RentWise/i);
    
    // Verify main heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    
    // Check for Initialize Access button
    const accessBtn = page.getByText(/Initialize Access/i);
    await expect(accessBtn).toBeVisible();
  });

  test('Properties page loads and handles empty states', async ({ page }) => {
    await page.goto(`${BASE_URL}/properties`);
    
    // Verify properties header
    const header = page.getByText(/Live Inventory/i);
    await expect(header).toBeVisible();
    
    // Either we see properties or "Zero Matches Found"
    // Since scraping might be delayed, we check for either to prevent flaky failures
    const emptyState = page.getByText(/Zero Matches Found/i);
    const firstProperty = page.locator('.property-card').first();
    
    const hasEmptyState = await emptyState.isVisible();
    const hasProperty = await firstProperty.isVisible();
    
    expect(hasEmptyState || hasProperty).toBeTruthy();
  });

  test('Authentication layout renders properly', async ({ page }) => {
    // Check standard login
    await page.goto(`${BASE_URL}/login`);
    await expect(page.getByText(/Authenticate Session/i)).toBeVisible();

    // Check register
    await page.goto(`${BASE_URL}/register`);
    await expect(page.getByText(/Initialize Registry/i)).toBeVisible();
  });

});
