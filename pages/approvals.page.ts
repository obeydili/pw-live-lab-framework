import { Page, Locator } from '@playwright/test';

export class ApprovalsPage {
  readonly heading: Locator;
  readonly flash: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Approvals' });
    this.flash = page.getByRole('status');
  }

  async goto(): Promise<void> {
    await this.page.goto('/approvals');
  }

  /** Every row has the same Approve and Reject buttons, so actions are scoped to the order's row. */
  rowFor(orderId: string): Locator {
    return this.page
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: orderId, exact: true }) });
  }

  async approve(orderId: string): Promise<void> {
    await this.rowFor(orderId).getByRole('button', { name: 'Approve' }).click();
  }
}
