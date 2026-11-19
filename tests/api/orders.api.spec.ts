import { expect } from '@playwright/test';
import { test } from '../../fixtures/index';
import { env } from '../../helpers/env';
import { uniqueClientOrderId } from '../../helpers/test-data';
import type { CreateOrderRequest } from '../../types/order';

const newOrder = (overrides: Partial<CreateOrderRequest> = {}): CreateOrderRequest => ({
  symbol: 'BLUE',
  side: 'Sell',
  quantity: 25,
  limitPrice: 40.5,
  clientOrderId: uniqueClientOrderId(),
  ...overrides,
});

test.describe('Orders API', { tag: '@api' }, () => {
  test('GET /api/me returns the signed-in trader', async ({ apiClient }) => {
    expect(await apiClient.me()).toMatchObject({
      username: env.TRADER1_USERNAME,
      role: 'trader',
    });
  });

  test('a created order is pending and reads back unchanged', async ({ apiClient }) => {
    const payload = newOrder();

    const created = await apiClient.createOrder(payload);

    expect(created).toMatchObject({
      ...payload,
      status: 'Pending Approval',
      createdBy: env.TRADER1_USERNAME,
      decidedBy: null,
      executionStatus: null,
    });
    expect(await apiClient.getOrder(created.id)).toEqual(created);
  });

  test('an invalid quantity is rejected with a field message', async ({ apiClient }) => {
    await expect(apiClient.createOrder(newOrder({ quantity: 0 }))).rejects.toMatchObject({
      status: 400,
      body: {
        error: 'Validation failed.',
        details: { quantity: expect.stringContaining('Quantity') },
      },
    });
  });

  test('a trader cannot approve an order', async ({ apiClient }) => {
    const order = await apiClient.createOrder(newOrder());

    await expect(apiClient.approveOrder(order.id)).rejects.toMatchObject({
      status: 403,
      body: { error: 'Only a approver can do this.' },
    });
    expect((await apiClient.getOrder(order.id)).status).toBe('Pending Approval');
  });

  test('an approved order fills asynchronously', async ({ apiClient, approverApiClient }) => {
    const order = await apiClient.createOrder(newOrder());

    const approved = await approverApiClient.approveOrder(order.id);

    expect(approved).toMatchObject({
      status: 'Approved',
      decidedBy: env.APPROVER1_USERNAME,
      executionStatus: 'Working',
    });
    // Execution is eventually consistent: Working → Partially Filled → Filled.
    await expect
      .poll(async () => (await apiClient.getOrder(order.id)).executionStatus, { timeout: 10_000 })
      .toBe('Filled');
  });

  test('a rejected order keeps the reason', async ({ apiClient, approverApiClient }) => {
    const order = await apiClient.createOrder(newOrder());

    const rejected = await approverApiClient.rejectOrder(order.id, 'Price is too far from market');

    expect(rejected).toMatchObject({
      status: 'Rejected',
      rejectionReason: 'Price is too far from market',
      executionStatus: null,
    });
  });
});
