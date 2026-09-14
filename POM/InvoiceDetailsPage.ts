import { Page, Locator } from '@playwright/test';

export class InvoiceDetailsPage {
    readonly page: Page;
    readonly invoiceNumber: Locator;
    readonly total: Locator;
    readonly street: Locator;
    readonly postalCode: Locator;
    readonly city: Locator;
    readonly state: Locator;
    readonly paymentMethod: Locator;

    constructor(page: Page) {
        this.page = page;
        // These are read-only <input> fields, not text elements, so their
        // content is read/asserted via value, not text content.
        this.invoiceNumber = page.getByTestId('invoice-number');
        this.total = page.getByTestId('total');
        this.street = page.getByTestId('street');
        this.postalCode = page.getByTestId('postal_code');
        this.city = page.getByTestId('city');
        this.state = page.getByTestId('state');
        this.paymentMethod = page.getByTestId('payment-method');
    }
}