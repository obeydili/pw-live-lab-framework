import { test } from '../../fixtures';
import { expect } from '@playwright/test';
import { env } from '../../helpers/env';

// This ensures this specific file starts with no cookies/session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login UI', { tag: ['@ui', '@auth'] }, () => {
  test('successful login', async ({ loginPage, page }) => {
    await loginPage.navigate();
    await loginPage.login(env.TRADER1_USERNAME, env.TRADER1_PASSWORD);
    await expect(page).toHaveURL('/orders');
  });

  test('unsuccessful login', async ({ loginPage }) => {
    await loginPage.navigate();
    await loginPage.login('BadUsername', 'BadPassword');
    await expect(loginPage.errorMessage).toHaveText('Invalid username or password.');
  });
});
