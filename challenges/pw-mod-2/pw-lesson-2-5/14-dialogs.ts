import { chromium, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const traderCtx = await browser.newContext({ baseURL: BASE_URL });
  const approverCtx = await browser.newContext({ baseURL: BASE_URL });
  try {
    await traderCtx.request.post('/api/test/reset');
    const traderPage = await traderCtx.newPage();
    await traderPage.goto('/login');
    await traderPage.getByLabel('username').fill('trader1');
    await traderPage.getByLabel('password').fill(env.TRADER1_PASSWORD);
    await traderPage.getByRole('button', { name: 'Sign in' }).click();
    await expect(traderPage).toHaveURL('/orders');
    const postOrder = await traderCtx.request.post('api/orders', {
      data: {
        symbol: 'DLTA',
        side: 'Sell',
        quantity: 300,
        limitPrice: 35,
      },
    });
    expect(postOrder.status()).toBe(201);
    const { id } = await postOrder.json();
    console.log(id);
    await traderPage.goto(`/orders/${id}`);
    await expect(traderPage).toHaveURL(`/orders/${id}`);
    traderPage.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await traderPage.getByRole('button', { name: 'Cancel order' }).click();
    await traderPage.goto(`/orders`);
    await expect(traderPage.getByRole('row').filter({ hasText: `${id}` })).toBeVisible();
    await traderPage.goto(`/orders/${id}`);
    traderPage.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await traderPage.getByRole('button', { name: 'Cancel order' }).click();
    //await traderPage.goto(`/orders`);
    //await expect(traderPage).toHaveURL('/orders');
    await expect(traderPage.getByRole('status')).toHaveText(`Order ${id} cancelled.`);
    const cancelledOrder = await traderCtx.request.get(`api/orders/${id}`);
    expect(cancelledOrder.status()).toBe(404);
    //await expect(traderPage.getByRole('row').filter({hasText: `${id}`})).toBeHidden();
    await approverCtx.request.post('/api/auth/login', {
      data: {
        username: 'approver1',
        password: env.APPROVER1_PASSWORD,
      },
    });

    const approverPage = await approverCtx.newPage();
    await approverPage.goto('/orders');
    await expect(approverPage).toHaveURL('/orders');
    await approverPage
      .getByRole('row')
      .filter({ hasText: 'Pending Approval' })
      .first()
      .getByText('View')
      .click();
    await approverPage.getByRole('button', { name: 'Reject with reason…' }).click();
    await expect(approverPage.getByTestId('order-status')).toHaveText('Pending Approval');

    const dialogMessages: string[] = [];
    approverPage.on('dialog', async (dialog) => {
      dialogMessages.push(dialog.type(), dialog.message());
      if (dialog.type() === 'prompt') {
        // Accepts the prompt and fills in the text field
        await dialog.accept(' ');
      } else if (dialog.type() === 'alert') {
        // Dismisses the alert window (clicks OK)
        await dialog.dismiss();
      }
    });
    await approverPage.getByRole('button', { name: 'Reject with reason…' }).click();
    expect(dialogMessages).toEqual(['prompt', 'Reason for rejection:', 'alert', 'A rejection reason is required.']);
    approverPage.removeAllListeners('dialog');
      

    let dialogMessage: string | undefined;
    approverPage.once('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept('Price too high');
    });
    await approverPage.getByRole('button', { name: 'Reject with reason…' }).click();
    //console.log(dialogMessage);
    expect(dialogMessage).toBe('Reason for rejection:');
    await expect(approverPage.getByTestId('order-status')).toHaveText('Rejected');
    await expect(approverPage.locator('dd[data-field = "rejectionReason"]')).toHaveText(
      'Price too high',
    );

    const postOrder2 = await traderCtx.request.post('api/orders', {
      data: {
        symbol: 'ACME',
        side: 'Sell',
        quantity: 100,
        limitPrice: 50,
      },
    });

    const { id: id2, status: Status } = await postOrder2.json();
    expect(Status).toBe('Pending Approval');

    const longString = 'a'.repeat(201);

    const reasonRejected = await approverCtx.request.post(`/api/orders/${id2}/reject`, {
      data: {
        reason: longString,
      },
    });
    expect(reasonRejected.status()).toBe(400);
    const jsonResponse = await reasonRejected.json();
    expect(jsonResponse.details.reason).toBe('Reason must be 1 to 200 characters.');

    // TODO: two contexts: trader1 and approver1 (context.request logins)
    // TODO: trader: create an order; Cancel and say No; the order still exists
    // TODO: Cancel and say Yes; /orders with the cancelled flash; the order is gone
    // TODO: approver: Reject with no handler -> still Pending
    // TODO: a handler that answers the prompt with spaces and records every dialog: prompt, then alert
    // TODO: answer "Price too high" -> Rejected and the Rejection reason row; over the API a 201-character reason is rejected

    console.log('PASS: TODO');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
