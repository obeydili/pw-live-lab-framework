import { chromium, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  try {
    await page.goto('/login');
    await expect(page.getByLabel('username')).toBeVisible();
    await page.getByLabel('username').fill('trader1');
    await page.getByLabel('password').fill('WrongPass');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('#login-error')).toBeVisible();
    await page.getByLabel('username').fill('trader1');
    await page.getByLabel('password').fill(env.TRADER1_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/.*\/orders/);
    await expect(page.getByText('Trader One (trader)')).toBeVisible();
    await expect(page.getByText('All orders, newest first', { exact: true })).toBeVisible();
    console.log('PASS');
  } finally {
    await browser.close();
  }
}

main().catch(() => {
  process.exit(1);
});
