import { chromium, request, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await api.post('/api/test/reset');
    const configResponse = await api.post('/api/test/config', {
      data: {
        latencyMs: -1,
      },
    });

    await expect(configResponse.status()).toBe(400);
    const jsonConfigResponse = await configResponse.json();
    expect(jsonConfigResponse).toHaveProperty('details.latencyMs');
    const configResponse2 = await api.post('/api/test/config', {
      data: {
        latencyMs: 1500,
      },
    });

    await expect(configResponse2.ok()).toBeTruthy();
    const startTime = Date.now();
    const loginResponse = await context.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });
    const duration = Date.now() - startTime;
    console.log(`Login request took ${duration}ms`);
    expect(duration).toBeLessThan(1000);
    await expect(loginResponse.status()).toBe(200);
    await page.goto('/orders');
    await expect(page.getByRole('progressbar', { name: 'Loading orders' })).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Loading orders' })).toBeHidden({
      timeout: 10000,
    });
    await expect(
      page.getByRole('row').filter({
        has: page.getByRole('link', { name: 'View' }),
      }),
    ).toHaveCount(10);

    // TODO: send latencyMs -1 to the test config endpoint -> 400 with details.latencyMs
    // TODO: set latencyMs 1500; login via context.request stays under 1 s
    // TODO: goto /orders; getByRole('progressbar', { name: 'Loading orders' }) visible, then hidden (raise the timeout)
    // TODO: 10 data rows
    // TODO: (cleanup below) after the reset, read the config back and warn if latency is not 0

    console.log('PASS: TODO');
  } finally {
    await api.post('/api/test/reset'); // TODO: also confirm the config is back to defaults
    const getResetResponse = await api.get('/api/test/config');
    const jsonGetResetResponse = await getResetResponse.json();
    if (jsonGetResetResponse.latencyMs !== 0) {
      console.warn('Latency is not set back to 0!');
    }
    //expect (jsonGetResetResponse.latencyMs).toBe(0);
    await browser.close();
    await api.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
