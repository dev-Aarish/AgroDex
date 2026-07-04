import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should display landing page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check if main title and tagline exist on the Landing page
    // Use first() because 'AgroDex' appears in the navbar logo AND hero section
    await expect(page.getByText('AgroDex', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Stop Food Fraud')).toBeVisible();
    
    // Check if CTA buttons are present (use first() because some links appear in both hero and footer)
    await expect(page.getByRole('link', { name: /Get Started/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Live Demo/i }).first()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // The landing page does not have direct login buttons, navigate to /login
    await page.goto('/login');
    
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    // Check that the email sign-in form is present
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
