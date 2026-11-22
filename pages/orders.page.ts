import { Page, Locator } from '@playwright/test';

export class OrdersPage {
  public readonly progressBar: Locator;
  public readonly exportCSV: Locator;
  public readonly rows: Locator;
  public readonly cells: Locator;

  constructor(public readonly page: Page) {
    this.progressBar = this.page.getByRole('progressbar', { name: 'Loading orders' });
    this.exportCSV = this.page.getByRole('link', { name: 'Export CSV' });
    this.rows = this.page.getByRole('row');
    this.cells = this.page.getByRole('cell');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/orders');
  }

  rowById(id: string): Locator {
    return this.rows.filter({
      has: this.page.getByRole('cell', { name: id, exact: true }),
    });
  }
}
