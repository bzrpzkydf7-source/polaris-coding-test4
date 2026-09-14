import { Page } from '@playwright/test';
import { CategoryPage } from '../POM/CategoryPage';
import { ProductCategory } from '../Models/ProductCategory';

export async function browseToProduct(page: Page, category: ProductCategory, productName: string) {
    const categoryPage = new CategoryPage(page);

    await categoryPage.goto();
    await categoryPage.openCategory(category);
    await categoryPage.selectProduct(productName);
}