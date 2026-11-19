import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('login page loads with correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Krishna Overseas/i);
  });

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/login');

    const emailInput = page.locator('input[placeholder*="company.com" i], input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
  });

  test('login page has sign-in button', async ({ page }) => {
    await page.goto('/login');

    const submitButton = page.locator('button:has-text("Sign in")');
    await expect(submitButton.first()).toBeVisible();
  });

  test('empty login stays on login page', async ({ page }) => {
    await page.goto('/login');

    await page.locator('button[type="submit"]').click({ force: true });

    // Should stay on login page (client-side validation prevents submit)
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/login/);
  });

  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Navigation Smoke Tests', () => {
  test('favicon is accessible', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });
});
