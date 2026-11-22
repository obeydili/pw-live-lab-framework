import { Page, Locator } from '@playwright/test';
import type { CsvInputFile } from '../types/order';

export class ImportPage {
  public readonly heading1: Locator;
  public readonly chooseFileInput: Locator;
  public readonly uploadButton: Locator;

  constructor(public readonly page: Page) {
    this.heading1 = page.getByRole('heading', { level: 1 });
    this.chooseFileInput = page.getByLabel('Orders CSV file');
    this.uploadButton = page.getByRole('button', { name: 'Upload' });
  }

  async uploadCsv(csvInput: CsvInputFile): Promise<void> {
    await this.chooseFileInput.setInputFiles({
      name: csvInput.name,
      mimeType: csvInput.mimeType ?? 'text/csv',
      buffer: Buffer.isBuffer(csvInput.buffer) ? csvInput.buffer : Buffer.from(csvInput.buffer),
    });
  }

  async clickUploadButton(): Promise<void> {
    await this.uploadButton.click();
  }
}
