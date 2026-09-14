
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { login, logout } from '../steps/loginScreen';
import { updateFirstName } from '../steps/accountProfile';
import { browseToProduct } from '../steps/productBrowsing';
import { LoginPage } from '../POM/LoginPage';
import { AccountProfilePage } from '../POM/AccountProfilePage';
import { ProductDetailsPage } from '../POM/ProductDetailsPage';
import { CheckoutPage } from '../POM/CheckoutPage';
import { AuthApi } from '../Api/AuthApi';
import { UsersApi } from '../Api/UsersApi';
import { Users } from '../Models/UserInterfaces';
import { ApiUser } from '../Models/ApiTypes';
import { ProductCategory } from '../Models/ProductCategory';
import { invalidCredentials } from '../TestData/InvalidCredentials';
import { Products } from '../TestData/Products';
import usersData from '../TestData/Users.json';

const users: Users = usersData;
const customer3AuthFile = 'playwright/.auth/customer3.json';

test.describe('User Story 4: Update Fields in Account Profile', () => {
    // customer3/Bob is a shared, publicly-documented demo account. These tests
    // don't depend on each other's outcome, only on not racing each other, so
    // 'default' (in order, same worker, no skip-on-failure) is used instead of
    // 'serial' — it still overrides the project's fullyParallel setting, but a
    // failure in one test won't skip the rest.
    test.describe.configure({ mode: 'default' });

    test.describe('Valid login shows the correct user and persists until logout', () => {
        test('ValidLogin_showsCorrectUserName_andPersistsAcrossNavigationUntilLogout', { tag: '@story-4-update-account-profile' }, async ({ page }) => {
            const loginPage = new LoginPage(page);

            await test.step('Given Bob logs in with valid credentials', async () => {
                await login(page, users.customer3.email, users.customer3.password);
            });

            await test.step('Then the account menu displays his correct name', async () => {
                // Matches on surname only, not the mutable first name: the
                // profile-update test below changes the first name, and this
                // is a shared external account other test runs could touch too.
                await expect(loginPage.userMenuButton).toContainText(users.customer3.surname);
            });

            await test.step('When he navigates to other pages', async () => {
                await page.getByTestId('nav-home').click();
                await page.getByTestId('nav-contact').click();
            });

            await test.step('Then he remains logged in', async () => {
                await expect(loginPage.userMenuButton).toBeVisible({ timeout: 10000 });
            });

            await test.step('When he logs out', async () => {
                await logout(page);
            });

            await test.step('Then he is signed out and the sign-in link is shown again', async () => {
                await expect(loginPage.signInLink).toBeVisible();
            });
        });
    });

    test.describe('Edge case: invalid credentials are rejected', () => {
        test('InvalidCredentials_showsAppropriateErrorMessage', { tag: '@story-4-update-account-profile' }, async ({ page }) => {
            const loginPage = new LoginPage(page);

            await test.step('Given the login page is open', async () => {
                await loginPage.goto();
                await loginPage.openSignIn();
            });

            await test.step('When the user submits an unknown email and password', async () => {
                await loginPage.enterCredentials(invalidCredentials.email, invalidCredentials.password);
                await loginPage.submitLogin();
            });

            await test.step('Then an appropriate error message is shown and the user is not logged in', async () => {
                await expect(loginPage.loginErrorMessage).toHaveText(/invalid email or password/i);
                await expect(loginPage.userMenuButton).not.toBeVisible();
            });
        });
    });

    // Reuses one pre-authenticated session (login itself isn't under test here).
    test.describe('Profile editing, reusing one pre-authenticated session', () => {
        let originalProfile: ApiUser;

        // storageState: undefined avoids inheriting the nested describe's
        // test.use({ storageState }), which would make this try to read the
        // file it's meant to create.
        test.beforeAll(async ({ browser, request }) => {
            mkdirSync(dirname(customer3AuthFile), { recursive: true });
            const context = await browser.newContext({ storageState: undefined });
            const page = await context.newPage();
            await login(page, users.customer3.email, users.customer3.password);
            await context.storageState({ path: customer3AuthFile });
            await context.close();

            // Snapshot Bob's real profile now, before any test below can change
            // it, so afterAll can restore exactly this rather than a guess.
            const authApi = new AuthApi(request);
            const usersApi = new UsersApi(request);
            const token = await authApi.loginAndGetToken(users.customer3.email, users.customer3.password);
            originalProfile = await (await usersApi.getMe(token)).json();
        });

        test.afterAll(async ({ request }) => {
            const authApi = new AuthApi(request);
            const usersApi = new UsersApi(request);
            const token = await authApi.loginAndGetToken(users.customer3.email, users.customer3.password);
            await usersApi.patch(originalProfile.id, token, {
                first_name: originalProfile.first_name,
                phone: originalProfile.phone,
                address: originalProfile.address,
            });
        });

        test.describe('Tests using the reused session', () => {
            test.use({ storageState: customer3AuthFile });

            test.describe('Updating profile fields succeeds and is reflected elsewhere', () => {
                // Bob's fixture account (see TestData/Users.json); phone/postal code/state
                // are required to save but aren't part of the seeded fixture data.
                const requiredContactDetails = { phone: '01234567890', postalCode: 'AB1 2CD', state: 'Greater London' };
                // Unique per run, since this account's prior value can't be assumed.
                const updatedFirstName = `Bobby${Date.now()}`;

                test('UpdateProfile_withValidRequiredFields_succeedsAndReflectsOnHomepage', { tag: '@story-4-update-account-profile' }, async ({ page }) => {
                    const loginPage = new LoginPage(page);
                    const profilePage = new AccountProfilePage(page);

                    await test.step('Given Bob is already logged in (reused session)', async () => {
                        await page.goto('/');
                        await expect(loginPage.userMenuButton).toBeVisible();
                    });

                    await test.step('When he updates his first name and required contact details', async () => {
                        // updateFirstName waits for the save-confirmation toast itself,
                        // so a failed save already throws here.
                        await updateFirstName(page, updatedFirstName, requiredContactDetails);
                    });

                    // No cleanup step — other tests capture this account's current
                    // values live rather than assuming a fixed baseline.
                    await test.step('Then the updated contact details persist after a reload', async () => {
                        await page.reload();
                        await expect(profilePage.phoneInput).toHaveValue(requiredContactDetails.phone);
                        await expect(profilePage.postalCodeInput).toHaveValue(requiredContactDetails.postalCode);
                        await expect(profilePage.stateInput).toHaveValue(requiredContactDetails.state);
                    });

                    await test.step('Then the updated name is reflected on the homepage', async () => {
                        await page.goto('/');
                        await expect(loginPage.userMenuButton).toHaveText(`${updatedFirstName} ${users.customer3.surname}`);
                    });

                    await test.step('And the updated name is reflected at checkout', async () => {
                        await browseToProduct(page, ProductCategory.HAND_TOOLS, Products.BOLT_CUTTERS);
                        await new ProductDetailsPage(page).addToCartButton.click();

                        const checkoutPage = new CheckoutPage(page);
                        await checkoutPage.open();
                        await checkoutPage.proceedFromCartButton.click();
                        await expect(checkoutPage.signInGreeting(updatedFirstName, users.customer3.surname)).toBeVisible();
                    });
                });
            });

            test.describe('Edge case: a required field left blank blocks the update', () => {
                test('ClearingRequiredField_blocksProfileUpdate_andShowsValidationMessage', { tag: '@story-4-update-account-profile' }, async ({ page }) => {
                    const profilePage = new AccountProfilePage(page);
                    let firstNameBeforeEdit: string;

                    await test.step('Given Bob is on his profile page (reused session)', async () => {
                        await profilePage.goto();
                        // Captured rather than assumed to equal the TestData fixture:
                        // this shared account's first name can be mid-flux from the
                        // update-profile test (or another concurrent test run).
                        firstNameBeforeEdit = await profilePage.firstNameInput.inputValue();
                    });

                    await test.step('When he clears the required first name field and submits', async () => {
                        await profilePage.fillFirstName('');
                        await profilePage.submit();
                    });

                    await test.step('Then the update is blocked with a validation message', async () => {
                        await expect(profilePage.validationErrorMessage).toBeVisible();
                        await expect(profilePage.successMessage).not.toBeVisible();
                    });

                    await test.step('And the original name is unchanged after a reload', async () => {
                        await page.reload();
                        await expect(profilePage.firstNameInput).toHaveValue(firstNameBeforeEdit);
                    });
                });
            });

            test.describe('Edge case: other required contact fields cannot be left blank', () => {
                const requiredFields = [
                    { fieldName: 'LastName', label: 'last name', getInput: (p: AccountProfilePage) => p.lastNameInput },
                    { fieldName: 'Street', label: 'street', getInput: (p: AccountProfilePage) => p.streetInput },
                    { fieldName: 'City', label: 'city', getInput: (p: AccountProfilePage) => p.cityInput },
                    { fieldName: 'Country', label: 'country', getInput: (p: AccountProfilePage) => p.countryInput },
                ];

                for (const { fieldName, label, getInput } of requiredFields) {
                    test(`Clearing${fieldName}_blocksProfileUpdate_andShowsValidationMessage`, { tag: '@story-4-update-account-profile' }, async ({ page }) => {
                        const profilePage = new AccountProfilePage(page);
                        const input = getInput(profilePage);
                        let valueBeforeEdit: string;

                        await test.step('Given Bob is on his profile page (reused session)', async () => {
                            await profilePage.goto();
                            valueBeforeEdit = await input.inputValue();
                        });

                        await test.step(`When he clears the required ${label} field and submits`, async () => {
                            await input.fill('');
                            await profilePage.submit();
                        });

                        await test.step('Then the update is blocked with a validation message', async () => {
                            await expect(profilePage.validationErrorMessage).toBeVisible();
                            await expect(profilePage.successMessage).not.toBeVisible();
                        });

                        await test.step(`And the original ${label} is unchanged after a reload`, async () => {
                            await page.reload();
                            await expect(input).toHaveValue(valueBeforeEdit);
                        });
                    });
                }
            });

            test.describe('Edge case: an invalid phone format blocks the update', () => {
                test('InvalidPhoneFormat_blocksProfileUpdate', { tag: '@story-4-update-account-profile' }, async ({ page }) => {
                    const profilePage = new AccountProfilePage(page);
                    let phoneBeforeEdit: string;

                    await test.step('Given Bob is on his profile page (reused session)', async () => {
                        await profilePage.goto();
                        phoneBeforeEdit = await profilePage.phoneInput.inputValue();
                    });

                    await test.step('When he enters a non-numeric phone number and submits', async () => {
                        await profilePage.phoneInput.fill('abc');
                        await profilePage.submit();
                    });

                    await test.step('Then the phone field is marked invalid and the update is blocked', async () => {
                        // No banner for an invalid format (unlike an empty field) —
                        // the field's own invalid state is the only visible signal.
                        await expect(profilePage.phoneInput).toHaveClass(/ng-invalid/);
                        await expect(profilePage.successMessage).not.toBeVisible();
                    });

                    await test.step('And the original phone number is unchanged after a reload', async () => {
                        await page.reload();
                        await expect(profilePage.phoneInput).toHaveValue(phoneBeforeEdit);
                    });
                });
            });

            test.describe('Edge case: a too-short phone number blocks the update', () => {
                test('TooShortPhoneNumber_blocksProfileUpdate', { tag: '@story-4-update-account-profile' }, async ({ page }) => {
                    const profilePage = new AccountProfilePage(page);
                    let phoneBeforeEdit: string;

                    await test.step('Given Bob is on his profile page (reused session)', async () => {
                        await profilePage.goto();
                        phoneBeforeEdit = await profilePage.phoneInput.inputValue();
                    });

                    await test.step('When he enters a phone number one digit below the minimum length and submits', async () => {
                        // Confirmed empirically: 6 digits fails, 7 digits passes.
                        await profilePage.phoneInput.fill('123456');
                        await profilePage.submit();
                    });

                    await test.step('Then the phone field is marked invalid and the update is blocked', async () => {
                        await expect(profilePage.phoneInput).toHaveClass(/ng-invalid/);
                        await expect(profilePage.successMessage).not.toBeVisible();
                    });

                    await test.step('And the original phone number is unchanged after a reload', async () => {
                        await page.reload();
                        await expect(profilePage.phoneInput).toHaveValue(phoneBeforeEdit);
                    });
                });
            });
        });
    });

});