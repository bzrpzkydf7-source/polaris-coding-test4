import { test, expect } from '@playwright/test';
import { login, logout } from '../steps/loginScreen';
import { Users } from '../Models/UserInterfaces';
import usersData from '../TestData/Users.json';

const users: Users = usersData;

test.describe('Login Feature', () => {

    test.describe('Login with valid credentials reaches the correct landing page for each user role', () => {
        for (const [userKey, user] of Object.entries(users)) {
            const expectedUrl = user.userRole === 'Admin' ? /admin\/dashboard/ : /\/account/;

            test(`Login_with${userKey}Credentials_reachesExpectedLandingPage`, async ({ page }) => {
                await test.step(`Given the ${userKey} user's valid credentials`, async () => {
                    // Precondition only: user, email and password come from the TestData fixture.
                });

                await test.step('When they log in', async () => {
                    await login(page, user.email, user.password);
                });

                await test.step(`Then they land on the expected page for their role (${user.userRole})`, async () => {
                    await expect(page).toHaveURL(expectedUrl);
                });
            });
        }
    });

    test.describe('Logout ends the session and returns the user to the login page', () => {
        test('Logout_afterLogin_returnsToLoginPage', async ({ page }) => {
            await test.step('Given a logged-in admin user', async () => {
                await login(page, users.admin.email, users.admin.password);
            });

            await test.step('When they log out', async () => {
                await logout(page);
            });

            await test.step('Then they are returned to the login page', async () => {
                await expect(page).toHaveURL(/auth\/login/);
            });
        });
    });

});