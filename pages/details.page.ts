import { Page, Locator } from '@playwright/test';

export class DetailsPage {
  public readonly symbolData: Locator;
  public readonly sideData: Locator;
  public readonly quantityData: Locator;
  public readonly limitPriceData: Locator;
  public readonly statusBadge: Locator;
  public readonly createdBy: Locator;
  public readonly decidedBy: Locator;
  public readonly executionData: Locator;
  public readonly timeInForceData: Locator;
  public readonly goodTillDate: Locator;
  public readonly urgentData: Locator;
  public readonly notesData: Locator;
  public readonly cancelOrderButton: Locator;
  public readonly duplicateOrderButton: Locator;

  constructor(public readonly page: Page) {
    this.symbolData = page.locator('dd[data-field="symbol"]');
    this.sideData = page.locator('dd[data-field="side"]');
    this.quantityData = page.locator('dd[data-field="quantity"]');
    this.limitPriceData = page.locator('dd[data-field="limitPrice"]');
    this.statusBadge = page.getByTestId('order-status');
    this.createdBy = page.locator('dd[data-field="createdBy"]');
    this.decidedBy = page.locator('dd[data-field="decidedBy"]');
    this.executionData = page.getByTestId('execution-status');
    this.timeInForceData = page.locator('dd[data-field="timeInForce"]');
    this.goodTillDate = page.locator('dd[data-field="goodTillDate"]');
    this.urgentData = page.locator('dd[data-field="urgent"]');
    this.notesData = page.locator('dd[data-field="notes"]');
    this.cancelOrderButton = page.getByRole('button', { name: 'Cancel order' });
    this.duplicateOrderButton = page.getByRole('button', { name: 'Duplicate order' });
  }

  async clickCancelOrder(): Promise<void> {
    await this.cancelOrderButton.click();
  }

  async clickDuplicateOrder(): Promise<void> {
    await this.duplicateOrderButton.click();
  }
}
