import { request, expect } from '@playwright/test';
import type { APIResponse } from '@playwright/test';
import { readJson } from '../../../helpers/readJson';
import type { LoginResponse, CreateOrderRequest, Order } from '../../../types/order';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  // TODO: request.newContext; reset; 401 check; login; create order; get by id; 404 check; dispose
  const apiContext = await request.newContext({
    baseURL: BASE_URL,
  });

  try {
    const response1: APIResponse = await apiContext.post('/api/test/reset');
    expect(response1.status()).toBe(200);

    const response2: APIResponse = await apiContext.get('/api/me');
    expect(response2.status()).toBe(401);

    const response3: APIResponse = await apiContext.post('/api/auth/login', {
      data: { username: 'trader1', password: env.TRADER1_PASSWORD },
    });
    
    const { token } = await readJson<LoginResponse>(response3);
    
    const Data: CreateOrderRequest = {
      symbol: 'ACME',
      side: 'Buy',
      quantity: 10,
      limitPrice: 12.5,
    };

    const response4:APIResponse = await apiContext.post('/api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: Data,
    });

    expect(response4.status()).toBe(201);
    //const jsonResponse4: Order = await response4.json();
    //const orderId = jsonResponse4.id;
    const { id: orderId, status: statusResponse4 } = await readJson<Order>(response4)
    expect(statusResponse4).toBe('Pending Approval');
    

    const response5:APIResponse = await apiContext.get(`/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const jsonResponse5 = await readJson<Order>(response5);
    expect(jsonResponse5.symbol).toBe(Data.symbol);
    expect(jsonResponse5.side).toBe(Data.side);
    expect(jsonResponse5.quantity).toBe(Data.quantity);
    expect(jsonResponse5.limitPrice).toBe(Data.limitPrice);
    // expect(jsonResponse5).toMatchObject(Data);

    const response6: APIResponse = await apiContext.get(`/api/orders/ORD-9999`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    expect(response6.status()).toBe(404);
    console.log('PASS');
  } finally {
    await apiContext.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
