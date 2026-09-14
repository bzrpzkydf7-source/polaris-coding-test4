import { Page, Locator } from '@playwright/test';
import { ProductCategory } from '../Models/ProductCategory';

export class CategoryPage {
    readonly page: Page;
    readonly categoriesMenuButton: Locator;
    readonly productNames: Locator;
    readonly pageNumberButtons: Locator;
    readonly nextPageButton: Locator;
    readonly previousPageButton: Locator;
    readonly previousPageItem: Locator;

    constructor(page: Page) {
        this.page = page;
        this.categoriesMenuButton = page.getByTestId('nav-categories');
        this.productNames = page.getByTestId('product-name');
        this.pageNumberButtons = page.getByRole('button', { name: /^Page-\d+$/ });
        this.nextPageButton = page.getByTestId('pagination-next');
        this.previousPageButton = page.getByTestId('pagination-prev');
        // The prev/next buttons are <a role="button"> elements; a disabled page
        // is only conveyed via a "disabled" class on the parent <li>, not via
        // the disabled/aria-disabled attribute Playwright's toBeDisabled() checks.
        this.previousPageItem = page.locator('li.page-item.disabled', { has: this.previousPageButton });
    }

    async goto() {
        await this.page.goto('/');
    }

    async openCategory(category: ProductCategory) {
        await this.categoriesMenuButton.click();
        await this.page.getByRole('link', { name: category, exact: true }).click();
    }

    categoryFilterCheckbox(category: ProductCategory): Locator {
        return this.page.getByRole('checkbox', { name: category, exact: true });
    }

    async filterByCategory(category: ProductCategory) {
        await this.categoryFilterCheckbox(category).check();
    }

    async clearCategoryFilter(category: ProductCategory) {
        await this.categoryFilterCheckbox(category).uncheck();
    }

    async selectProduct(productName: string) {
        await this.page.getByRole('heading', { name: productName, exact: true }).click();
    }

    async goToNextPage() {
        await this.nextPageButton.click();
    }
}