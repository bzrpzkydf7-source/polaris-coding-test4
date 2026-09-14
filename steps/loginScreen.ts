import { Page, expect } from '@playwright/test';
import { LoginPage } from '../POM/LoginPage';

export async function login(page: Page, email: string, password: string) {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.openSignIn();
    await loginPage.enterCredentials(email, password);
    await loginPage.submitLogin();
    // Login is async; without waiting here, a caller that immediately does a
    // hard navigation (e.g. page.goto to another route) can race ahead of the
    // in-flight request and land on that route while still unauthenticated.
    await expect(loginPage.userMenuButton).toBeVisible();
}

export async function logout(page: Page) {
    const loginPage = new LoginPage(page);

    await loginPage.openUserMenu();
    await loginPage.clickSignOut();
}