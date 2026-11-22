import { chromium, request, expect } from '@playwright/test';
import { env } from '../../../helpers/env';
import type { Order } from '../../../types/order';
import { ensureError } from '../../../helpers/errors';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await api.post('/api/test/reset');

    // TODO: log in over the API (Bearer) and GET /api/orders?sort=-createdAt&page=1&pageSize=10

    const loginResponse = await api.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    const jsonLogin = await loginResponse.json();
    const token = jsonLogin.token;

    const getOrdersResponse = await api.get('/api/orders?sort=-createdAt&page=1&pageSize=10', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    await expect(getOrdersResponse.status()).toBe(200);

    const ordersBody: Order[] = await getOrdersResponse.json();
    await page.goto('/login');
    await page.getByLabel('username').fill('trader1');
    await page.getByLabel('password').fill(env.TRADER1_PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/.*\/orders/);
    const rows = page.getByRole('row').filter({
      has: page.getByRole('link', {
        name: 'View',
        exact: true,
      }),
    });

    await expect(rows).toHaveCount(10);
    let caughtError: unknown;
    try {
      await page.getByRole('row').click();
    } catch (e) {
      caughtError = ensureError(e);
    }
    expect(caughtError).toBeDefined();
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toContain('strict mode violation');

    await expect(rows.first()).toContainText(ordersBody[0].id);
    await expect(rows.last()).toContainText(ordersBody[ordersBody.length - 1].id);

    //Dostum, I am confused for the '4th order found by an exact cell and check its status badge'...

    const fourthOrderId = ordersBody[3].id;

    const orderCell = page.getByRole('cell', {
      name: fourthOrderId,
      exact: true,
    });

    const specificRow = page.getByRole('row').filter({
      has: orderCell,
    });

    const orderStatus = specificRow.getByTestId('order-status');

    await expect(orderStatus).toHaveText(ordersBody[3].status);

    // TODO: count rows with an Approved badge against the API, then click View and check the heading

    const approvedRows = rows.filter({
      has: page.getByText('Approved', {
        exact: true,
      }),
    });

    const approvedApiOrders = ordersBody.filter((order) => order.status === 'Approved');

    await expect(approvedRows).toHaveCount(approvedApiOrders.length);

    await rows
      .first()
      .getByRole('link', {
        name: 'View',
      })
      .click();
    await expect(page).toHaveURL(`/orders/${ordersBody[0].id}`);

    await expect(page.getByRole('heading')).toContainText(ordersBody[0].id);

    console.log('PASS: TODO');
  } finally {
    await browser.close();
    await api.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
