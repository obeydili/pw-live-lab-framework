import { chromium, request, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await api.post('/api/test/reset');
    const response1 = await api.post('/api/test/config', {
      data: {
        fillDelayMs: 3000,
      },
    });

    await expect(response1.ok()).toBeTruthy();
    const response2 = await api.post('/api/auth/login', {
      data: {
        username: 'approver1',
        password: env.APPROVER1_PASSWORD,
      },
    });

    const jsonResponse2 = await response2.json();
    const approverToken = jsonResponse2.token;
    const response3 = await api.post('/api/orders/ORD-1003/approve', {
      headers: {
        Authorization: 'Bearer ' + approverToken,
      },
    });
    const jsonResponse3 = await response3.json();
    await expect(jsonResponse3).toMatchObject({
      status: 'Approved',
      executionStatus: 'Working',
    });

    await expect.poll(
        async () => {
          // Fetch the order details from your API
          const response4 = await api.get('/api/orders/ORD-1003', {
            headers: {
              token: approverToken,
            },
          });
          const order = await response4.json();

          // Return the execution status for the assertion
          return order.executionStatus;
        },
        {
          // Polling configuration
          message: 'Execution status did not become Filled within the timeout period',
          timeout: 10000,
        },
      )
      .toBe('Filled');

    await context.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    const order = {
      symbol: 'ACME',
      side: 'Buy',
      quantity: 15000,
      limitPrice: 7.05,
    };
    const postOrder = await context.request.post('/api/orders', {
      data: order,
    });

    await expect(postOrder.ok()).toBeTruthy();
    const jsonPostOrder = await postOrder.json();
    const orderId = jsonPostOrder.id;
    console.log(orderId);
    const response5 = await api.post(`/api/orders/${orderId}/approve`, {
      headers: {
        Authorization: `Bearer ${approverToken}`,
      },
    });

    console.log(await response5.json());

    await expect(response5.ok()).toBeTruthy();
    await page.goto(`/orders/${orderId}`);
    await expect(page.getByTestId('execution-status')).toHaveText('Filled');
    await expect(async () => {
      const response6 = await context.request.get(`/api/orders/${orderId}`);
      const jsonResponse6 = await response6.json();
      await expect(jsonResponse6.filledAt).toBeTruthy();
      await expect(page.locator('dd[data-field = "filledAt"]')).not.toHaveText('—');
    }).toPass();

    // TODO: set fillDelayMs to 3000 on the test config endpoint
    // TODO: approver1 approves ORD-1003 (Bearer); expect Approved / Working
    // TODO: poll the API until execution is Filled (timeout 10 s)
    // TODO: trader1 creates ACME; approver approves; open details; execution-status toHaveText Filled
    // TODO: retry a block of assertions: filledAt is set over the API; the "Filled at" dd is not —
    // TODO: (cleanup below) resetting restores fillDelayMs

    console.log('PASS: TODO');
  } finally {
    await api.post('/api/test/reset'); // TODO: also confirm the config is back to defaults
    const response7 = await api.get('/api/test/config');
    const jsonResponse7 = await response7.json();
    await expect(jsonResponse7.fillDelayMs).toBe(4000);
    await browser.close();
    await api.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
