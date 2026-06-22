import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should display landing page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if main title exists
    await expect(page.getByText('AgroDex', { exact: true })).toBeVisible();
    await expect(page.getByText('Securing Indonesia')).toBeVisible();
    
    // Check if login buttons are present
    await expect(page.getByRole('button', { name: /Login as Farmer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Login as Auditor/i })).toBeVisible();
  });

  test('should navigate to login page when clicking Farmer login', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /Login as Farmer/i }).click();
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  });
});
