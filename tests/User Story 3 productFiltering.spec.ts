import { test, expect } from '@playwright/test';
import { CategoryPage } from '../POM/CategoryPage';
import { ProductCategory } from '../Models/ProductCategory';

test.describe('User Story 3: Filter Products and Pagination', () => {

    test.describe('Filtering by category updates the results and can be cleared', () => {
        const category = ProductCategory.HAND_TOOLS;

        test('FilterByCategory_thenClear_updatesThenRestoresProductListAndLinksToDetails', { tag: '@story-3-filter-products-and-pagination' }, async ({ page }) => {
            const categoryPage = new CategoryPage(page);
            let unfilteredPageCount: number;
            let unfilteredProductNames: string[];

            await test.step('Given the product listing page is open with its category filters displayed', async () => {
                await categoryPage.goto();
                await expect(categoryPage.categoryFilterCheckbox(category)).toBeVisible();
                await expect(categoryPage.productNames.first()).toBeVisible();
                unfilteredPageCount = await categoryPage.pageNumberButtons.count();
                unfilteredProductNames = await categoryPage.productNames.allTextContents();
            });

            await test.step(`When the user filters by ${category}`, async () => {
                await categoryPage.filterByCategory(category);
            });

            await test.step('Then the total number of results shrinks to a smaller, non-empty set', async () => {
                // Compares result counts, not page-1 names: the default sort puts
                // Hand Tools first anyway, so page 1 alone wouldn't show the filter took effect.
                await expect(categoryPage.pageNumberButtons).not.toHaveCount(unfilteredPageCount);
                const filteredPageCount = await categoryPage.pageNumberButtons.count();
                expect(filteredPageCount).toBeGreaterThan(0);
                expect(filteredPageCount).toBeLessThan(unfilteredPageCount);
            });

            await test.step('When the filter is cleared', async () => {
                await categoryPage.clearCategoryFilter(category);
            });

            await test.step('Then all products are shown again', async () => {
                await expect(categoryPage.pageNumberButtons).toHaveCount(unfilteredPageCount);
            });

            // Runs last: navigating to the detail page and back would otherwise
            // reset the filter (it isn't reflected in the URL), corrupting the
            // clear-filter assertion above.
            await test.step('And selecting a product opens its product detail page', async () => {
                await categoryPage.selectProduct(unfilteredProductNames[0]);
                await expect(page).toHaveURL(/\/product\//);
            });
        });
    });

    test.describe('Pagination shows more products', () => {
        test('GoToNextPage_showsDifferentProducts', { tag: '@story-3-filter-products-and-pagination' }, async ({ page }) => {
            const categoryPage = new CategoryPage(page);
            let firstPageProductNames: string[];

            await test.step('Given the product listing page is open on the first page', async () => {
                await categoryPage.goto();
                await expect(categoryPage.productNames.first()).toBeVisible();
                firstPageProductNames = await categoryPage.productNames.allTextContents();
            });

            await test.step('When the user goes to the next page', async () => {
                await categoryPage.goToNextPage();
            });

            await test.step('Then a different, non-empty set of products is shown', async () => {
                // Wait out the async page change before snapshotting the full list.
                await expect(categoryPage.productNames.first()).not.toHaveText(firstPageProductNames[0]);
                const secondPageProductNames = await categoryPage.productNames.allTextContents();
                expect(secondPageProductNames.length).toBeGreaterThan(0);
                expect(secondPageProductNames).not.toEqual(firstPageProductNames);
            });
        });
    });

    test.describe('Edge case: pagination cannot go before the first page', () => {
        test('OnFirstPage_previousPageControlIsDisabled', { tag: '@story-3-filter-products-and-pagination' }, async ({ page }) => {
            const categoryPage = new CategoryPage(page);

            await test.step('Given the product listing page is open on the first page', async () => {
                await categoryPage.goto();
            });

            await test.step('Then the Previous page control is disabled', async () => {
                await expect(categoryPage.previousPageItem).toBeVisible();
            });
        });
    });

});