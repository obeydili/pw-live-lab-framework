import { expect } from '@playwright/test';
import { test } from '../../fixtures/index';
import { newOrder } from '../../data/orders';
import { ApiClient } from '../../helpers/api-client';

test.describe('create orders', { tag: '@api' }, () => {
  test('create successful order', async ({ apiClient }) => {
    const order1 = newOrder({
      symbol: 'ACME',
      quantity: 30,
    });

    const orderJson = await apiClient.createOrder(order1);
    expect(await apiClient.getOrder(orderJson.id)).toMatchObject({
      ...order1,
      status: 'Pending Approval',
    });
  });

  test('create existing order rejected', async ({ apiClient }) => {
    const order2 = newOrder();
    await apiClient.createOrder(order2);
    await expect(apiClient.createOrder(order2)).rejects.toMatchObject({
      status: 409,
      body: { error: expect.stringContaining('already exists') },
    });
  });

  test('401 me check for naked API client and get unexisting order check', async ({
    request,
    apiClient,
  }) => {
    const client = new ApiClient(request);
    await expect(client.me()).rejects.toMatchObject({
      status: 401,
    });

    await expect(apiClient.getOrder('ORD-9999')).rejects.toMatchObject({
      status: 404,
    });
  });
});
