import { chromium, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await context.request.post('/api/test/reset');
    const loginResponse = await context.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });
    expect(loginResponse.status()).toBe(200);

    const invalidGet = await context.request.get('api/quotes/XYZ');
    expect(invalidGet.status()).toBe(404);

    const acmeQuotes = await context.request.get('api/quotes/ACME');
    expect(acmeQuotes.status()).toBe(200);
    const { last: lastAcme } = await acmeQuotes.json();

    const blueQuotes = await context.request.get('api/quotes/BLUE');
    expect(blueQuotes.status()).toBe(200);
    const { last: lastBlue } = await blueQuotes.json();

    await page.goto('/orders/ORD-1001');
    const popupPromise = page.waitForEvent('popup');
    await page.getByText('Open quote').click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL('/quotes/ACME');
    await expect(popup.getByRole('heading')).toHaveText('ACME quote');
    await expect(popup).toHaveTitle('ACME quote · Trade Desk Lite');
    await expect(popup.locator('dd[data-field="last"]')).toContainText(String(lastAcme));
    await popup.close();
    await expect(page).toHaveURL('/orders/ORD-1001');
    await page.goto('/orders/new');
    const iFrame = page.frameLocator('iframe[id="quote-frame"]');
    await expect(iFrame.getByText('Choose a symbol to see a quote.')).toBeVisible();
    await page.getByRole('combobox', { name: 'Symbol' }).selectOption('BLUE');
    await expect
      .poll(async () => {
     const lastText = (await iFrame.getByTestId('last-price').textContent()) ?? '0';
        const lastTextBlue = parseFloat(lastText ?? '');
        return lastTextBlue;
      })
      .toBe(lastBlue);

    await iFrame.getByText('Use last price').click();
    await expect(page.getByRole('spinbutton', { name: 'Limit price' })).toHaveValue(
      lastBlue.toFixed(2),
    );
    await page.getByRole('radio', { name: 'Buy' }).click();
    await page.getByLabel('Quantity').fill('300');
    await expect(page.getByRole('button', { name: 'Submit order' })).toBeEnabled();
    await expect(
      page.locator('iframe[id="quote-frame"]').contentFrame().getByRole('heading'),
    ).toHaveText('Market quote');
    //await expect(page).toHaveURL(/\?created=1/)

    // TODO: API: /api/quotes/XYZ 404; read ACME and BLUE quotes
    // TODO: ORD-1001: start waiting for the new tab, click Open quote; URL, title, heading, last price; close it
    // TODO: /orders/new: inside #quote-frame, the empty message is shown
    // TODO: select BLUE; expect.poll the frame last price equals the API value
    // TODO: Use last price -> Limit price toHaveValue(last.toFixed(2)); Buy + 300 -> Submit enabled
    // TODO: reach the same frame from its element locator and check the heading

    console.log('PASS: TODO');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
