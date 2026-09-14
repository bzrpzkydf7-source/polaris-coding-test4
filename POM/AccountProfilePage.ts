import { Page, Locator, expect } from '@playwright/test';

export class AccountProfilePage {
    readonly page: Page;
    readonly firstNameInput: Locator;
    readonly lastNameInput: Locator;
    readonly phoneInput: Locator;
    readonly streetInput: Locator;
    readonly postalCodeInput: Locator;
    readonly cityInput: Locator;
    readonly stateInput: Locator;
    readonly countryInput: Locator;
    readonly updateProfileButton: Locator;
    readonly successMessage: Locator;
    readonly validationErrorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        // Locating by label (visible text), not the data-test hook, so these
        // match what a user actually sees on the form.
        this.firstNameInput = page.getByLabel('First name');
        this.lastNameInput = page.getByLabel('Last name');
        this.phoneInput = page.getByLabel('Phone');
        this.streetInput = page.getByLabel('Street');
        this.postalCodeInput = page.getByLabel('Postal code');
        this.cityInput = page.getByLabel('City');
        this.stateInput = page.getByLabel('State');
        this.countryInput = page.getByLabel('Country');
        this.updateProfileButton = page.getByRole('button', { name: 'Update Profile' });
        this.successMessage = page.getByText(/successfully updated/i);
        // The whole form must be valid to save (all required fields, not just
        // the one being edited), so a blocked save shows this same banner
        // regardless of which required field is empty.
        this.validationErrorMessage = page.getByText(/correct the highlighted fields/i);
    }

    async goto() {
        await this.page.goto('/account/profile');
        // Form loads empty, then is patched async from GET /users/me — wait for
        // that to land before filling, or a fast fill gets silently overwritten.
        await expect(this.firstNameInput).not.toHaveValue('');
    }

    async fillFirstName(firstName: string) {
        await this.firstNameInput.fill(firstName);
    }

    async fillRequiredContactDetails(phone: string, postalCode: string, state: string) {
        await this.phoneInput.fill(phone);
        await this.postalCodeInput.fill(postalCode);
        await this.stateInput.fill(state);
    }

    async submit() {
        await this.updateProfileButton.click();
    }
}