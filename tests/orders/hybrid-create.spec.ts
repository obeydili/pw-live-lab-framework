import { expect } from '@playwright/test';
import { test } from '../../fixtures/index';
import { uniqueOrder } from '../../data/orders';

// No apiClient.reset() here: reset restores the seed for the whole server, which would delete
// orders that tests running in parallel are using. Each test creates its own order instead.

test(
  'trader can create order via API and see it in UI',
  { tag: '@hybrid' },
  async ({ apiClient, ordersPage }) => {
    const order = await apiClient.createOrder({
      ...uniqueOrder(),
      quantity: 300,
      limitPrice: 20,
    });
    await ordersPage.navigate();
    await expect(ordersPage.rowById(order.id)).toContainText('Pending Approval');
  },
);

test(
  'trader2 can create order via API and see it in UI',
  { tag: '@trader2' },
  async ({ trader2ApiClient, trader2OrdersPage }) => {
    const order = await trader2ApiClient.createOrder({
      ...uniqueOrder(),
      quantity: 300,
      limitPrice: 20,
    });
    await trader2OrdersPage.navigate();
    await expect(trader2OrdersPage.rowById(order.id)).toContainText('Pending Approval');
  },
);
