import { test, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

test('API-created order shows up in the UI', async ({ page, request }) => {
  // TODO: API setup, UI login, waitForResponse, assertions
  const response1 = await request.post('/api/auth/login', {
    data: {
      username: 'trader1',
      password: env.TRADER1_PASSWORD,
    },
  });

  const jsonResponse1 = await response1.json();
  const token = jsonResponse1.token;

  const resetResponse = await request.post('/api/test/reset', {
    headers: {
      Authorization: token,
    },
  });
  expect(resetResponse.ok()).toBeTruthy();

  const response2 = await request.post('/api/orders', {
    headers: {
      Authorization: token,
    },
    data: {
      symbol: 'BLUE',
      side: 'Sell',
      quantity: 25,
      limitPrice: 40,
      clientOrderId: 'Order1',
    },
  });
  expect(response2.ok()).toBeTruthy();
  const jsonResponse2 = await response2.json();
  const orderId = jsonResponse2.id;

  await page.goto('/login');
  await page.getByLabel('username').fill('trader1');
  await page.getByLabel('password').fill(env.TRADER1_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  const row = page.getByRole('row').filter({ hasText: `${orderId}` });
  await expect(row).toContainText('Pending Approval');
  const responsePromise = page.waitForResponse(
    (res) => res.url().includes(`/api/orders/${orderId}`) && res.request().method() === 'GET',
  );
  await page.goto(`/orders/${orderId}`);
  const response3 = await responsePromise;
  expect(response3.status()).toBe(200);
  await expect(page.getByRole('heading', { name: `Order ${orderId}` })).toBeVisible();
  console.log('Pass');
});
