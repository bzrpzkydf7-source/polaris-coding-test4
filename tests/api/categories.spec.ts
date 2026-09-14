import { test, expect } from '@playwright/test';
import { CategoriesApi } from '../../Api/CategoriesApi';
import { HttpStatus } from '../../Models/HttpStatus';
import { ProductCategory } from '../../Models/ProductCategory';

test.describe('API: GET /categories/tree', () => {

    test('GetCategoryTree_returnsTopLevelCategoriesMatchingTheProductCategoryModel', { tag: ['@api', '@story-3-filter-products-and-pagination'] }, async ({ request }) => {
        const categoriesApi = new CategoriesApi(request);

        const response = await categoriesApi.getTree();

        expect(response.status()).toBe(HttpStatus.OK);
        const categories: { name: string; sub_categories: unknown[] }[] = await response.json();
        const topLevelNames = categories.map((category) => category.name);

        // Not a full-set match: Special Tools and Rentals are nav sections,
        // not entries in this taxonomy.
        expect(topLevelNames).toEqual(
            expect.arrayContaining([ProductCategory.HAND_TOOLS, ProductCategory.POWER_TOOLS, ProductCategory.OTHER]),
        );

        for (const category of categories) {
            expect(Array.isArray(category.sub_categories)).toBe(true);
        }
    });

});
