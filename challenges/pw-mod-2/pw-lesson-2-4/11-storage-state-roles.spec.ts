import { test, expect } from '@playwright/test';
import os from 'node:os';
import path from 'node:path';
import { env } from '../../../helpers/env';

const statePath = (user: string) => path.join(os.tmpdir(), `pw-mod-2-${user}.json`);

test.beforeAll(async ({ playwright, baseURL }) => {
  // TODO: reset, then log in trader1 and approver1 over the API and save each session to statePath(user)
  const api = await playwright.request.newContext({ baseURL: baseURL});
  try {
    const resetResponse = await api.post('/api/test/reset');
    expect(resetResponse.status()).toBe(200);
    const loginResponse = await api.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });
    expect(loginResponse.status()).toBe(200);
    await api.storageState({
      path: statePath('trader1'),
    });
    const loginResponse2 = await api.post('/api/auth/login', {
      data: {
        username: 'approver1',
        password: env.APPROVER1_PASSWORD,
      },
    });
    expect(loginResponse2.status()).toBe(200);
    await api.storageState({
      path: statePath('approver1'),
    });
  } finally {
    await api.dispose();
  }
});

test('trader cannot open approvals', async ({ browser }) => {
  // TODO: new context from the saved trader session; nav check; /approvals -> 403 page
  const trader1Context = await browser.newContext({ storageState: statePath('trader1') });
  try {
    const trader1Page = await trader1Context.newPage();
    await trader1Page.goto('/');
    await expect(trader1Page.getByRole('link', { name: 'Approvals' })).toHaveCount(0);
    const response = await trader1Page.goto('/approvals');
    expect(response?.status()).toBe(403);
    await expect(trader1Page.getByText('Not allowed')).toBeVisible();
  } finally {
    await trader1Context.close();
  }
});

test('approver cannot open the order ticket', async ({ browser }) => {
  // TODO: new context from the saved approver session; approvals table; /orders/new -> 403; /api/me role
  const approverContext = await browser.newContext({ storageState: statePath('approver1') });
  try {
    const approverPage = await approverContext.newPage();
    await approverPage.goto('/');
    await approverPage.getByRole('link', { name: 'Approvals' }).click();
    await expect(approverPage).toHaveURL('/approvals');
    const response = await approverPage.goto('/orders/new');
    expect(response?.status()).toBe(403);
    await expect(approverPage.getByText('Not allowed')).toBeVisible();
    const meResponse = await approverContext.request.get('/api/me');
    expect((await meResponse.json()).role).toBe('approver');
  } finally {
    await approverContext.close();
  }
});

test('no session redirects to login', async ({ page }) => {
  // TODO: /orders -> /login?next=%2Forders
  await page.goto('/orders');
  await expect(page).toHaveURL('/login?next=%2Forders');
});
