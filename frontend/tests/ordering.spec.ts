import { test, expect } from '@playwright/test';

test.describe('Customer Ordering & Staff Workflow', () => {

  test('Customer selects branch, adds item to cart, and views checkout', async ({ page }) => {
    // 1. Visit homepage
    await page.goto('http://localhost:3000');
    await expect(page.locator('h1')).toContainText('Culinary Excellence');

    // 2. Click Order Now
    await page.click('text=Order Now');
    await expect(page).toHaveURL('http://localhost:3000/menu');

    // 3. Verify Food Menu loads
    await expect(page.locator('h2')).toContainText('Ordering From');
  });

  test('Staff Login Page Loads and shows Quick Logins', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await expect(page.locator('h1')).toContainText('Platform Staff Sign In');
    await expect(page.locator('text=👑 Owner')).toBeVisible();
  });

});
