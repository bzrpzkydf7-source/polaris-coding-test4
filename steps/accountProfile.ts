import { Page, expect } from '@playwright/test';
import { AccountProfilePage } from '../POM/AccountProfilePage';

interface RequiredContactDetails {
    phone: string;
    postalCode: string;
    state: string;
}

export async function updateFirstName(page: Page, firstName: string, requiredContactDetails: RequiredContactDetails) {
    const profilePage = new AccountProfilePage(page);

    await profilePage.goto();
    await profilePage.fillFirstName(firstName);
    // The profile form only saves when every required field is valid, so the
    // contact details have to be (re)supplied even when just changing the name.
    await profilePage.fillRequiredContactDetails(
        requiredContactDetails.phone,
        requiredContactDetails.postalCode,
        requiredContactDetails.state,
    );
    await profilePage.submit();

    // confirm save succeeded
    await expect(profilePage.successMessage).toBeVisible();
}