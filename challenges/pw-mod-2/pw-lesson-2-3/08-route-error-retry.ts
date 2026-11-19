import { chromium, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await context.request.post('/api/test/reset');
    await page.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    await page.route('**/api/orders*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'Application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/orders');
    await expect(page.getByText('Could not load orders.')).toBeVisible();
    await expect(
      page.getByRole('row').filter({
        has: page.getByRole('link', {
          name: 'View',
        }),
      }),
    ).toHaveCount(0);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/orders') && r.request().method() === 'GET',
    );
    await page.unroute('**/api/orders*');
    await page.getByText('Retry').click();
    const response = await responsePromise;
    await expect(response.status()).toBe(200);
    await expect(
      page.getByRole('row').filter({
        has: page.getByRole('link', {
          name: 'View',
        }),
      }),
    ).toHaveCount(10);

    await page.route('**/api/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'Application/json',
        headers: { 'X-Total-Count': '1', 'X-Total-Pages': '1' },
        json: [{ id: 'ORD-9001', status: 'Rejected' }],
      });
    });

    await page.reload();
    await expect(page.getByRole('row').filter({
      has: page.getByText('ORD-9001')
    }).filter({
      has: page.getByText('Rejected')
    })).toBeVisible();
    await page.unrouteAll();

    // TODO: const ORDERS_API = '**/api/orders*'
    // TODO: route -> fulfill 500; goto /orders; alert "Could not load orders."; 0 rows
    // TODO: remove the 500 handler; arm a response wait; click Retry; 200 and 10 rows
    // TODO: route -> fulfill one ORD-9001 Rejected order with X-Total-Count / X-Total-Pages
    // TODO: reload; exactly one row with ORD-9001 and a Rejected badge
    // TODO: remove every route handler at the end

    console.log('PASS: TODO');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
