import { Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly page: Page;
    readonly signInLink: Locator;
    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly loginSubmitButton: Locator;
    readonly userMenuButton: Locator;
    readonly signOutLink: Locator;
    readonly loginErrorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.signInLink = page.getByTestId('nav-sign-in');
        this.emailInput = page.getByTestId('email');
        this.passwordInput = page.getByTestId('password');
        this.loginSubmitButton = page.getByTestId('login-submit');
        this.userMenuButton = page.getByTestId('nav-menu');
        this.signOutLink = page.getByTestId('nav-sign-out');
        this.loginErrorMessage = page.getByTestId('login-error');
    }

    async goto() {
        await this.page.goto('/');
    }

    async openSignIn() {
        await this.signInLink.click();
    }

    async enterCredentials(email: string, password: string) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
    }

    async submitLogin() {
        await this.loginSubmitButton.click();
    }

    async openUserMenu() {
        await this.userMenuButton.click();
    }

    async clickSignOut() {
        await this.signOutLink.click();
    }
}