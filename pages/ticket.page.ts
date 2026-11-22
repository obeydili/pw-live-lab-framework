import { Page, Locator } from '@playwright/test';
import type { Symbol } from '../types/order';


export class TicketPage {
  public readonly symbolSelect: Locator;
  public readonly radioBuy: Locator;
  public readonly radioSell: Locator;
  public readonly quantityInput: Locator;
  public readonly limitPriceInput: Locator;
  public readonly timeInForceSelect: Locator;
  public readonly goodTillDateInput: Locator;
  public readonly markAsUrgentBox: Locator;
  public readonly notesOptionalField: Locator;
  public readonly submitButton: Locator;
  public readonly cancelButton: Locator;

  constructor(public readonly page: Page) {
    this.symbolSelect = page.getByLabel('symbol');
    this.radioBuy = page.getByRole('radio', { name: 'Buy' });
    this.radioSell = page.getByRole('radio', { name: 'Sell' });
    this.quantityInput = page.getByLabel('quantity');
    this.limitPriceInput = page.getByLabel('Limit Price');
    this.timeInForceSelect = page.getByLabel('Time in force');
    this.goodTillDateInput = page.getByLabel('Good till date');
    this.markAsUrgentBox = page.getByLabel(/Mark as urgent/i);
    this.notesOptionalField = page.getByLabel('Notes (optional)');
    this.submitButton = page.getByRole('button', {
      name: 'Submit order',
    });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
  }

  async navigate(): Promise<void> {
    await this.page.goto('/orders/new');
  }

  async selectSymbol(symbol: Symbol): Promise<void> {
    await this.symbolSelect.selectOption(symbol);
  }

  async checkBuy(): Promise<void> {
    await this.radioBuy.check();
  }

  async checkSell(): Promise<void> {
    await this.radioSell.check();
  }

  async fillQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(quantity.toString());
  }

  async fillLimitPrice(limitPrice: number): Promise<void> {
    await this.limitPriceInput.fill(limitPrice.toString());
  }

  async selectTimeInForce(option: 'Day' | 'Good till cancelled' | 'Good till date'): Promise<void> {
    await this.timeInForceSelect.selectOption(option);
  }

  async fillGoodTillDateInput(date: string): Promise<void> {
    await this.goodTillDateInput.fill(date);
  }

  async clickSubmitButton(): Promise<void> {
    await this.submitButton.click();
  }

  async clickCancelButton(): Promise<void> {
    await this.cancelButton.click();
  }
}
