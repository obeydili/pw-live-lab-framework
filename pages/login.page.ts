import { Page, Locator } from '@playwright/test';

export class LoginPage {
  public readonly usernameInput: Locator;
  public readonly passwordInput: Locator;
  public readonly signInButton: Locator;
  public readonly errorMessage: Locator;

  constructor(public readonly page: Page) {
    this.usernameInput = page.getByLabel('username');
    this.passwordInput = page.getByLabel('password');
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.errorMessage = page.getByRole('alert');
  }

  async navigate(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(user: string, pass: string) {
    await this.usernameInput.fill(user);
    await this.passwordInput.fill(pass);
    await this.signInButton.click();
  }
}
