import { chromium, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await context.request.post('/api/test/reset');

    await context.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    await page.goto('/orders');

    const requests: string[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/order') && req.method() === 'GET') {
        const qParameter = new URL(req.url()).searchParams.get('q');
        if (qParameter !== null) {
          requests.push(qParameter);
        }
      }
    });

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('q=ACME') && r.request().method() === 'GET',
    );

    await page.getByLabel('Search orders').pressSequentially('ACME', {
      delay: 60,
    });

    const response = await responsePromise;
    await expect(response.status()).toBe(200);
    const totalOrders = Number(response.headers()['x-total-count']);
    // Web-first wait instead of a fixed sleep: once the list shows the ACME result, typing and the
    // debounce are over, so any extra search request would already have been sent.
    await expect(page.getByText(`Showing 1–${totalOrders} of ${totalOrders} orders`)).toBeVisible();
    expect(requests).toHaveLength(1);
    console.log(requests);
    await expect(page).toHaveURL('/orders?q=ACME');
    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page.getByRole('row')).toHaveCount(11);

    // TODO: log in via context.request; goto /orders
    // TODO: listen to every outgoing request and collect q for GET /api/orders
    // TODO: type ACME into the search box one key at a time, 60 ms apart
    // TODO: wait for the response with q=ACME; assert only one search request
    // TODO: results-count reads "Showing 1–<n> of <total> orders" using the API total
    // TODO: URL has q=ACME; Clear filters resets the list

    console.log('PASS: TODO');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
