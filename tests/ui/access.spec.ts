import { expect } from '@playwright/test';
import { test } from '../../fixtures/index';
import { authFile } from '../../helpers/auth';
import { env } from '../../helpers/env';

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('a protected page redirects to login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL('/login?next=%2Forders');
  });

  test('a wrong password shows an error and stays on login', async ({ page, loginPage }) => {
    await loginPage.navigate();
    await loginPage.login(env.TRADER1_USERNAME, 'not-the-password');

    await expect(loginPage.errorMessage).toHaveText('Invalid username or password.');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('as trader1', () => {
  test.use({ storageState: authFile('trader1') });

  test('the approvals page is not allowed', async ({ page }) => {
    const response = await page.goto('/approvals');

    expect(response?.status()).toBe(403);
    await expect(page.getByText('Not allowed')).toBeVisible();
  });
});

test.describe('as approver1', () => {
  test.use({ storageState: authFile('approver1') });

  test('the order ticket is not allowed', async ({ page }) => {
    const response = await page.goto('/orders/new');

    expect(response?.status()).toBe(403);
    await expect(page.getByText('Not allowed')).toBeVisible();
  });
});
