import { test, expect } from '@playwright/test';
import { env } from '../../../helpers/env';

test('watchlist by drag-and-drop and by button', async ({ page }) => {
  await page.request.post('/api/test/reset');
  const loginResponse = await page.request.post('/api/auth/login', {
    data: {
      username: 'trader1',
      password: env.TRADER1_PASSWORD,
    },
  });

  expect(loginResponse.status()).toBe(200);

  await page.goto('/watchlist');
  await expect(page).toHaveURL('/watchlist');

  const dragItem = page.getByTestId('symbol-ACME');
  const dropZone = page.getByLabel('My watchlist');
  const promise = page.waitForResponse(
    (r) => r.url().includes('api/watchlist') && r.request().method() === 'PUT',
  );
  await dragItem.dragTo(dropZone);
  const response = await promise;
  await expect(page.getByText('Watchlist saved.').first()).toBeVisible();
  expect(response.status()).toBe(200);
  const { symbols } = await response.json();
  expect(symbols).toStrictEqual(['ACME']);
  const dragItem2 = page.getByTestId('symbol-BLUE');
  const promise2 = page.waitForResponse(
    (r) => r.url().includes('api/watchlist') && r.request().method() === 'PUT',
  );
  await dragItem2.dragTo(dropZone);
  const response2 = await promise2;
  await expect(page.getByText('Watchlist saved.').first()).toBeVisible();
  expect(response2.status()).toBe(200);
  const item3Add = page.getByTestId('symbol-CRSP').getByRole('button', { name: 'Add' });
  const promise3 = page.waitForResponse(
    (r) => r.url().includes('api/watchlist') && r.request().method() === 'PUT',
  );
  await item3Add.click();
  const response3 = await promise3;
  await expect(page.getByText('Watchlist saved.').first()).toBeVisible();
  expect(response3.status()).toBe(200);

  const response4 = await page.request.get('api/watchlist');
  expect(response4.status()).toBe(200);
  const watchlistData = await response4.json();
  expect(watchlistData).toMatchObject({ symbols: ['ACME', 'BLUE', 'CRSP'] });
  await expect(dropZone.getByTestId('symbol-ACME')).toBeVisible();
  await expect(dropZone.getByTestId('symbol-BLUE')).toBeVisible();
  await expect(dropZone.getByTestId('symbol-CRSP')).toBeVisible();

  const response5 = await page.request.put('/api/watchlist', {
    data: { symbols: ['BLUE', 'ACME', 'ACME'] },
  });

  expect(response5.status()).toBe(400);
  expect(await response5.json()).toMatchObject({
    error: 'Validation failed.',
    details: { symbols: 'Symbols must be an array of unique, valid symbols.' },
  });

  // TODO: reset and log in with page.request; watchlist starts empty
  // TODO: drag ACME into the watchlist, wait for the PUT; toast; API ['ACME']
  // TODO: drag BLUE; add CRSP with its button; 3 items in UI and API
  // TODO: duplicate PUT -> 400 with details.symbols
});
