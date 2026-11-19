import { chromium, request, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await context.request.post('/api/test/reset');
    await context.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    await page.goto('/orders/new');
    await expect(
      page.getByLabel('Limit price', {
        exact: true,
      }),
    ).toHaveCount(1);

    const aboutLimitPrice = page.getByRole('button', {
      name: 'About limit price',
    });

    await aboutLimitPrice.hover();
    await expect(page.getByRole('tooltip')).toBeVisible();
    await page.locator('body').hover();
    await expect(page.getByRole('tooltip')).toBeHidden();
    await aboutLimitPrice.hover();
    await aboutLimitPrice.focus();
    await expect(
      page.getByText(
        'The highest price you will pay to buy, or the lowest you will accept to sell.',
      ),
    ).toBeVisible();
    await aboutLimitPrice.press('Escape');
    await expect(
      page.getByText(
        'The highest price you will pay to buy, or the lowest you will accept to sell.',
      ),
    ).toBeHidden();
    await page.goto('/orders');
    await expect(page).toHaveURL('/orders');
    await page.keyboard.press('/');
    await page.keyboard.type('BLUE');
    await expect(page).toHaveURL('/orders?q=BLUE');
    const waitResponse = page.waitForResponse(
      (r) => r.url().includes('/api/orders') && !r.url().includes('q=') && r.request().method() === 'GET');
    await page.keyboard.press('Escape');
    const response = await waitResponse;
    await expect(response.ok()).toBeTruthy();;
    await page.locator('body').click();
    await page.keyboard.press('Alt+N');
    await expect(page).toHaveURL('/orders/new');
    await page.screenshot({ path: 'screenshot.png' });
    console.log('PASS: TODO');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
