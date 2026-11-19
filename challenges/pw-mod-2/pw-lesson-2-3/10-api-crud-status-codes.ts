import { request, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';


async function main() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const api2 = await request.newContext({ baseURL: BASE_URL });
  try {
    await api.post('/api/test/reset');
    const trader1Login = await api.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    const jsonTrader1Login = await trader1Login.json();
    const trader1Token = jsonTrader1Login.token;
    await expect(trader1Login.ok()).toBeTruthy();

    const trader2Login = await api.post('/api/auth/login', {
      data: {
        username: 'trader2',
        password: env.TRADER2_PASSWORD,
      },
    });

    const jsonTrader2Login = await trader2Login.json();
    const trader2Token = jsonTrader2Login.token;

    const approverLogin = await api.post('/api/auth/login', {
      data: {
        username: 'approver1',
        password: env.APPROVER1_PASSWORD,
      },
    });

    const jsonApproverLogin = await approverLogin.json();
    const approverToken = jsonApproverLogin.token;

    const initialOrder = {
      symbol: 'ACME',
      side: 'Buy',
      quantity: 20,
      limitPrice: 100,
    };
    const postOrder = await api.post('/api/orders', {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: initialOrder,
    });

    await expect(postOrder.ok()).toBeTruthy();
    const jsonPostOrder = await postOrder.json();
    const orderId = jsonPostOrder.id;

    const patchOrder = await api.patch(`/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        quantity: 30,
      },
    });
    expect(patchOrder.status()).toBe(200);
    const jsonPatchOrder = await patchOrder.json();
    expect(jsonPatchOrder.quantity).toBe(30);
    expect(jsonPatchOrder.updatedAt).not.toBeNull();

    const patchOrder2 = await api.patch('/api/orders/ORD-9999', {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        limitPrice: 120,
      },
    });

    expect(patchOrder2.status()).toBe(404);

    const patchOrder3 = await api.patch(`/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${trader2Token}`,
      },
      data: {
        symbol: 'DLTA',
      },
    });

    expect(patchOrder3.status()).toBe(403);

    const approveOrder = await api.post(`/api/orders/${orderId}/approve`, {
      headers: {
        Authorization: `Bearer ${approverToken}`,
      },
    });

    expect(approveOrder.status()).toBe(200);

    const approveOrder2 = await api.patch(`/api/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        status: 'Pending Approval',
      },
    });

    expect(approveOrder2.status()).toBe(409);

    const postOrder2 = await api.post('/api/orders', {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: initialOrder,
    });

    expect(postOrder2.status()).toBe(201);

    const jsonPostOrder2 = await postOrder2.json();
    const orderId2 = jsonPostOrder2.id;

    const patchOrder4 = await api.patch(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${approverToken}`,
      },
      data: {
        symbol: 'ECHO',
      },
    });

    expect(patchOrder4.status()).toBe(403);

    const patchOrder5 = await api.patch(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        symbol: 'EcHO',
      },
    });

    expect(patchOrder5.status()).toBe(400);

    const patchOrder6 = await api.patch(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        test: true,
      },
    });

    expect(patchOrder6.status()).toBe(400);

    const patchOrder7 = await api.patch(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {},
    });

    expect(patchOrder7.status()).toBe(400);

    const putOrder = await api.put(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        quantity: 200,
        limitPrice: 1000,
      },
    });

    expect(putOrder.status()).toBe(400);

    const putOrder2 = await api.put(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        id: `${orderId2}`,
        clientOrderId: null,
        symbol: 'ACME',
        side: 'Buy',
        quantity: 40,
        limitPrice: 200,
        status: 'Pending Approval',
        createdBy: 'trader1',
        createdAt: '2026-11-06T23:06:21.777Z',
        decidedBy: null,
        decidedAt: null,
        updatedAt: null,
        executionStatus: null,
        filledAt: null,
        rejectionReason: null,
        timeInForce: 'Day',
        goodTillDate: null,
        urgent: false,
        notes: null,
      },
    });

    expect(putOrder2.status()).toBe(200);

    const jsonPutOrder2 = await putOrder2.json();
    const order2ClientId = jsonPutOrder2.clientOrderId;
    expect(order2ClientId).toBe(null);

    const postOrder3 = await api.post('/api/orders', {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        symbol: 'BLUE',
        side: 'Sell',
        quantity: 300,
        limitPrice: 700,
        clientOrderId: 'ext-0011',
      },
    });

    expect(postOrder3.status()).toBe(201);

    const patchOrder8 = await api.patch(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
      data: {
        clientOrderId: 'ext-0011',
      },
    });

    expect(patchOrder8.status()).toBe(409);

    const deleteOrder = await api.delete(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader2Token}`,
      },
    });

    expect(deleteOrder.status()).toBe(403);

    const deleteOrder2 = await api.delete(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
    });
    expect(await deleteOrder2.text()).toBe('');
    expect(deleteOrder2.status()).toBe(204);

    const getOrder = await api.get(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
    });

    expect(getOrder.status()).toBe(404);

    const deleteOrder3 = await api.delete(`/api/orders/${orderId2}`, {
      headers: {
        Authorization: `Bearer ${trader1Token}`,
      },
    });

    expect(deleteOrder3.status()).toBe(404);

    const postOrder4 = await api.post('/api/orders', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trader1Token}`,
      },
      data: '{bad json',
    });

    expect(postOrder4.status()).toBe(400);
    expect(await postOrder4.json()).toEqual({ error: 'Malformed JSON body.' });

    const postLogin2 = await api.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    expect(postLogin2.status()).toBe(200);
    const jsonPostLogin2 = await postLogin2.json();
    const token2 = jsonPostLogin2.token;

    
    const postLogout = await api2.post('/api/auth/logout', {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });

    expect(postLogout.status()).toBe(204);

    const getMe = await api2.get('/api/me', {
      headers: {
        Authorization: `Bearer ${token2}`,
      },
    });

    expect(getMe.status()).toBe(401);

    // TODO: tokens for trader1, trader2, approver1; create an order
    // TODO: PATCH: 200, 404, 403 (trader2), 409 (not pending), 403 (approver), 400 x3 with details
    // TODO: PUT: 400 missing side; 200 full body -> clientOrderId null; PATCH a seed clientOrderId -> 409
    // TODO: DELETE: 403 trader2; 204 empty; then 404 GET and 404 DELETE
    // TODO: malformed JSON '{bad json' -> 400 { error: 'Malformed JSON body.' }
    // TODO: fresh context: login, Bearer logout 204, GET /api/me 401

    console.log('PASS: TODO');
  } finally {
    await api.dispose();
    await api2.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
