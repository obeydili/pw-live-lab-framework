import { Page, expect, test as base } from '@playwright/test';
import { ApiClient } from '../helpers/api-client';
import { env } from '../helpers/env';
import { LoginPage } from '../pages/login.page';
import { OrdersPage } from '../pages/orders.page';
import { ApprovalsPage } from '../pages/approvals.page';

type MyFixtures = {
  apiClient: ApiClient;
  trader2ApiClient: ApiClient;
  approverApiClient: ApiClient;
  traderPage: Page;
  loginPage: LoginPage;
  ordersPage: OrdersPage;
  trader2OrdersPage: OrdersPage;
  approvalsPage: ApprovalsPage;
  trader2Page: Page;
  approverPage: Page;
};

export const test = base.extend<MyFixtures>({
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await client.login(env.TRADER1_USERNAME, env.TRADER1_PASSWORD);
    await use(client);
  },
  trader2ApiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await client.login(env.TRADER2_USERNAME, env.TRADER2_PASSWORD);
    await use(client);
  },
  approverApiClient: async ({ request }, use) => {
    const client = new ApiClient(request);
    await client.login(env.APPROVER1_USERNAME, env.APPROVER1_PASSWORD);
    await use(client);
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
  ordersPage: async ({ page }, use) => {
    const ordersPage = new OrdersPage(page);
    await use(ordersPage);
  },
  approvalsPage: async ({ page }, use) => {
    await use(new ApprovalsPage(page));
  },
  trader2OrdersPage: async ({ trader2Page }, use) => {
    await use(new OrdersPage(trader2Page));
  },
  traderPage: async ({ page }, use) => {
    await page.goto('/login');
    const loginPage = new LoginPage(page);
    await loginPage.login(env.TRADER1_USERNAME, env.TRADER1_PASSWORD);
    await expect(page).toHaveURL(/\/orders/);
    await use(page);
  },
  trader2Page: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login(env.TRADER2_USERNAME, env.TRADER2_PASSWORD);
      await expect(page).toHaveURL(/\/orders/);
      await use(page);
    } finally {
      await context.close();
    }
  },
  approverPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto('/login');
      const loginPage = new LoginPage(page);
      await loginPage.login(env.APPROVER1_USERNAME, env.APPROVER1_PASSWORD);
      await expect(page).toHaveURL(/\/orders/);
      await use(page);
    } finally {
      await context.close();
    }
  },
});
