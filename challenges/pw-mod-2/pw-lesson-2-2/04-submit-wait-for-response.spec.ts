import { test, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

test.beforeEach(async ({ page, request }) => {
  // TODO: reset, sign in trader1 through the UI, wait until signed in
  const resetResponse = await request.post('/api/test/reset');
  expect(resetResponse.ok()).toBeTruthy();
  await page.goto('/login');
  await page.getByLabel('username').fill('trader1');
  await page.getByLabel('password').fill(env.TRADER1_PASSWORD);
  await page
    .getByRole('button', {
      name: 'Sign in',
    })
    .click();
  await expect(page).toHaveURL('/orders');
});

test('order ticket POST is captured and the UI follows it', async ({ page }) => {
  await page
    .getByRole('link', {
      name: 'New order',
    })
    .first()
    .click();
  await expect(page).toHaveURL('/orders/new');

  const order = {
    symbol: 'ECHO',
    side: 'Buy',
    quantity: 15000,
    limitPrice: 7.05,
  };

  await page.getByLabel('Symbol').selectOption(order.symbol);
  await page.getByLabel(' Buy').click();
  await page.getByLabel('Quantity').fill(order.quantity.toString());
  await page.getByLabel('Limit price').fill(order.limitPrice.toString());

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/orders') && res.request().method() === 'POST',
  );

  await page.getByText('Submit order').click();
  const response = await responsePromise;
  await expect(response.ok()).toBeTruthy();
  await expect(response.request().postDataJSON()).toMatchObject(order);
  await expect(page).toHaveURL(/.*\/orders\/(ORD-\d+)\?created=1/);
  // waitForURL acts as an auto-waiting assertion, but to fully cover to check for ?created=1, I could strictly verify the pattern with await expect(page).toHaveURL(/.*\/orders\/ORD-\d+\?created=1/);.
  const currentUrl = page.url();
  const urlWithoutParams = currentUrl.split('?')[0];
  const orderId = urlWithoutParams.split('/').pop();
  const getResponse = await page.request.get(`/api/orders/${orderId}`);
  await expect(await getResponse.json()).toMatchObject(order);
  await expect(page.getByText(`Order ${orderId} submitted for approval`)).toBeVisible();
  await expect(page.locator('h1[id="order-heading"]')).toHaveText(`Order ${orderId}`);
  await expect(page.getByTestId('order-status')).toHaveText('Pending Approval');

  console.log('Pass');
  // TODO: fill the ticket
  // TODO: start waiting for the POST /api/orders response, then click Submit
  // TODO: assert 201 and the JSON the browser sent
  // TODO: URL, flash, heading, badge; confirm through page.request
});
