import { chromium, request, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { env } from '../../../helpers/env';
import { toCsv } from '../../../helpers/csv';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3300';

async function main() {
  const api = await request.newContext({ baseURL: BASE_URL });
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();
  try {
    await api.post('/api/test/reset');
    const loginResponse = await context.request.post('/api/auth/login', {
      data: {
        username: 'trader1',
        password: env.TRADER1_PASSWORD,
      },
    });

    const { token } = await loginResponse.json();
    const getApprovedOrders = await api.get('api/orders', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        page: 1,
        pageSize: 25,
        status: 'Approved',
      },
    });

    //console.log(await getApprovedOrders.json());
    const totalCount = await getApprovedOrders.headers()['x-total-count'];

    await page.goto('/orders');
    await expect(page).toHaveURL('/orders');
    const waitResponse = page.waitForResponse(
      (r) => r.url().includes('api/orders?status=') && r.request().method() === 'GET',
    );
    await page
      .getByRole('combobox', {
        name: 'status',
      })
      .selectOption('Approved');
    await waitResponse;
    await expect(page).toHaveURL('/orders?status=Approved');
    const rowsWithView = await page
      .getByRole('row')
      .filter({ has: page.getByText('View') })
      .all();

    for (const row of rowsWithView) {
      await expect(row).toContainText('Approved');
    }

    await expect(page.getByRole('link', { name: 'Export CSV' })).toHaveAttribute(
      'href',
      /status=Approved/,
    );
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page
        .getByRole('link', {
          name: 'Export CSV',
        })
        .click(),
    ]);
    const suggestedFilename = download.suggestedFilename();
    console.log('File name:', suggestedFilename);

    const filePath = await download.path();
    console.log('Saved to:', filePath);
    expect(suggestedFilename).toMatch(/^orders-.*\.csv$/);
    const csvString = await readFile(filePath, 'utf8');
    const rows = csvString.trim().split(/\r?\n/);
    const dataRowCount = rows.length - 1;
    expect(dataRowCount).toBe(Number(totalCount));
    await page.goto('/orders/import');
    page.on('dialog', async (dialog) => dialog.accept());
    await page
      .getByRole('button', {
        name: 'Upload',
      })
      .click();

    const csvString2 = `symbol,side,quantity,limitPrice
    ECHO,Buy,710,11.25
    DLTA,Sell,1600,23.95
    CRSP,Buy,0,100`;

    await page.locator("input[id='csv-file']").setInputFiles({
      name: 'my-fake-file.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvString2),
    });

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/orders/import') && r.request().method() === 'POST',
      ),
      page.getByRole('button', { name: 'Upload' }).click(),
    ]);

    const responseBody = await response.json();
    expect(responseBody.created).toBeDefined();
    expect(responseBody.created).toBeInstanceOf(Array);
    expect(responseBody.created).toHaveLength(2);
    expect(responseBody.errors).toBeDefined();
    expect(responseBody.errors[0].line).toBe(4);
    expect(responseBody.createdLines).toBeDefined();
    expect(responseBody.createdLines).toEqual([2, 3]);

    await expect(page.getByText('2 created, 1 failed').first()).toBeVisible();
    await expect(
      page.getByText('Quantity must be a whole number from 1 to 1000000.'),
    ).toBeVisible();

    const importResponse = await api.post('/api/orders/import', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      data: { something: 'some string' },
    });

    expect(importResponse.status()).toBe(415);

    //let giantCsv = 'symbol,side,quantity,limitPrice\n';
    /**
    for (let i = 0; i < 101; i++) {
      giantCsv += 'ECHO,Buy,1,10\n';
    }
  **/

    const giantCsv = toCsv([
      ['symbol', 'side', 'quantity', 'limitPrice'],
      ...Array.from({ length: 100 }, () => ['ECHO', 'Buy', '1', '10']),
    ]);


    const importResponse2 = await api.post('/api/orders/import', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/csv',
      },
      data: giantCsv,
    });

    expect(importResponse2.status()).toBe(413);

    const loginResponse2 = await api.post('/api/auth/login', {
      data: {
        username: 'approver1',
        password: env.APPROVER1_PASSWORD,
      },
    });
    const { token: approverToken } = await loginResponse2.json();

    const importResponse3 = await api.post('/api/orders/import', {
      headers: {
        Authorization: `Bearer ${approverToken}`,
      },
      multipart: {
        title: 'CSV2',
        fileField: {
          name: 'my-fake-file3.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvString2),
        },
      },
    });

    expect(importResponse3.status()).toBe(403);

    // TODO: expected Approved total from X-Total-Count (pageSize 1)
    // TODO: Status select = Approved; Export CSV href has status=Approved
    // TODO: wait for the download event before the click; file name orders-<UTC date>.csv; parse and check rows
    // TODO: import page: No file chosen; Upload with no file -> alert (handle it in a listener)
    // TODO: put an in-memory file { name, mimeType, buffer } on the input: 2 valid rows + CRSP,Buy,0,100; wait for the import response
    // TODO: summary "2 created, 1 failed"; line 4 mentions Quantity; then over the API: wrong content type, too many rows, approver

    console.log('PASS: TODO');
  } finally {
    await browser.close();
    await api.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
