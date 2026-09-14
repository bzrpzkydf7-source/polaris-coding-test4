import { Page, Locator } from '@playwright/test';

export class InvoicesPage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async goto() {
        await this.page.goto('/account/invoices');
    }

    detailsLinkFor(invoiceNumber: string): Locator {
        return this.page.getByRole('row', { name: invoiceNumber }).getByRole('link', { name: 'Details' });
    }

    async openInvoice(invoiceNumber: string) {
        await this.detailsLinkFor(invoiceNumber).click();
    }
}