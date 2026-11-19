import { test as setup, expect } from '@playwright/test';
import { authFile, credentialsOf, type Account } from '../helpers/auth';

const accounts: Account[] = ['trader1', 'trader2', 'approver1'];

for (const account of accounts) {
  setup(`sign in as ${account}`, async ({ request }) => {
    // The login API sets the same session cookie as the login page, so no browser is needed.
    const response = await request.post('/api/auth/login', { data: credentialsOf(account) });
    await expect(response).toBeOK();
    await request.storageState({ path: authFile(account) });
  });
}
