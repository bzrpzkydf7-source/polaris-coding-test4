import { Page, Locator } from '@playwright/test';

export class ProductDetailsPage {
    readonly page: Page;
    readonly productName: Locator;
    readonly productDescription: Locator;
    readonly unitPrice: Locator;
    readonly addToCartButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.productName = page.getByTestId('product-name');
        this.productDescription = page.getByTestId('product-description');
        this.unitPrice = page.getByTestId('unit-price');
        this.addToCartButton = page.getByTestId('add-to-cart');
    }

    // No data-test attribute on the product image; matched by its accessible name instead.
    productImage(productName: string): Locator {
        return this.page.getByRole('img', { name: productName });
    }
}