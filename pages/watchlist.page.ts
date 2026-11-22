import { Page, Locator } from '@playwright/test';

export class WatchlistPage {
  public readonly symbolAcme: Locator;
  public readonly symbolBlue: Locator;
  public readonly symbolCrsp: Locator;
  public readonly symbolDlta: Locator;
  public readonly symbolEcho: Locator;
  public readonly myWatchListDropZone: Locator;
  public readonly watchListSavedLabel: Locator;
  public readonly heading1: Locator;

  constructor(public readonly page: Page) {
    this.heading1 = page.getByRole('heading', { level: 1 });
    this.symbolAcme = page.getByTestId('symbol-ACME');
    this.symbolBlue = page.getByTestId('symbol-BLUE');
    this.symbolCrsp = page.getByTestId('symbol-CRSP');
    this.symbolDlta = page.getByTestId('symbol-DLTA');
    this.symbolEcho = page.getByTestId('symbol-ECHO');
    this.myWatchListDropZone = page.getByLabel('My watchlist');
    this.watchListSavedLabel = page.getByText('Watchlist saved.');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/watchlist');
  }

  async dragToMyWatchList(dragItem: Locator): Promise<void> {
    await dragItem.dragTo(this.myWatchListDropZone);
  }
}
