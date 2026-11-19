import { test, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

test('API arranges, UI acts, API asserts', async ({ page, request }) => {
  // TODO: reset; trader2 Bearer login; create the order
  // TODO: approver1 UI login; /approvals; find the row by exact id
  // TODO: start waiting for the /approve response; click Approve; 200
  // TODO: toast, flash, row gone, Dismiss
  // TODO: API: Approved, decidedBy, createdBy
  await request.post('/api/test/reset');
  const authResponse = await request.post('/api/auth/login', {
    data: {
      username: 'trader2',
      password: env.TRADER2_PASSWORD,
    },
  });

  expect(authResponse.status()).toBe(200);
  const { token } = await authResponse.json();
  const postOrderResponse = await request.post('api/orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      symbol: 'CRSP',
      side: 'Sell',
      quantity: 40,
      limitPrice: 99.99,
    },
  });
  expect(postOrderResponse.status()).toBe(201);
  const { id } = await postOrderResponse.json();
  console.log(id);

  await page.goto('/login');
  await page.getByLabel('username').fill('approver1');
  await page.getByLabel('password').fill(env.APPROVER1_PASSWORD);
  await page
    .getByRole('button', {
      name: 'Sign in',
    })
    .click();
  await expect(page).toHaveURL('/orders');
  await page.goto('/approvals');
  await expect(page).toHaveURL('/approvals');
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/approve') && r.status() === 200,
  );
  await page
    .getByRole('row')
    .filter({
      has: page.getByRole('cell', { name: id, exact: true }),
    })
    .getByRole('button', {
      name: 'Approve',
    })
    .click();

  await responsePromise;

  // await expect(page.getByText(`Order ${id} approved.`)).toBeVisible();
  await expect(page.getByRole('status')).toHaveText(`Order ${id} approved.`);
  await expect(page.getByRole('status')).toBeVisible();
  //await toast.getByRole('button', { name: 'Dismiss notification' }).click();
  //await expect(toast).toHaveCount(0);

  await expect(
    page.getByRole('row').filter({
      has: page.getByText(id),
    }),
  ).toBeHidden();

  const getResponse = await request.get(`/api/orders/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  expect(getResponse.status()).toBe(200);
  const jsonGetResponse = await getResponse.json();
  await expect(jsonGetResponse).toMatchObject({
    status: 'Approved',
    createdBy: 'trader2',
    decidedBy: 'approver1',
  });
});
