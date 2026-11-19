import { expect } from '@playwright/test';
import { test } from '../../fixtures/index';
import { authFile } from '../../helpers/auth';
import { env } from '../../helpers/env';
import { uniqueClientOrderId } from '../../helpers/test-data';

// Starts signed in as approver1 from the session saved by tests/auth.setup.ts.
test.use({ storageState: authFile('approver1') });

test(
  'approver approves an API-created order on the approvals page',
  { tag: '@hybrid' },
  async ({ apiClient, approvalsPage }) => {
    const order = await apiClient.createOrder({
      symbol: 'CRSP',
      side: 'Buy',
      quantity: 40,
      limitPrice: 99.99,
      clientOrderId: uniqueClientOrderId(),
    });

    await approvalsPage.goto();
    await approvalsPage.approve(order.id);

    await expect(approvalsPage.flash).toHaveText(`Order ${order.id} approved.`);
    await expect(approvalsPage.rowFor(order.id)).toHaveCount(0);
    expect(await apiClient.getOrder(order.id)).toMatchObject({
      status: 'Approved',
      decidedBy: env.APPROVER1_USERNAME,
    });
  },
);
