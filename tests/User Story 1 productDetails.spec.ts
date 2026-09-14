import { test, expect } from '@playwright/test';
import { login } from '../steps/loginScreen';
import { browseToProduct } from '../steps/productBrowsing';
import { ProductDetailsPage } from '../POM/ProductDetailsPage';
import { ProductsApi } from '../Api/ProductsApi';
import { HttpStatus } from '../Models/HttpStatus';
import { Users } from '../Models/UserInterfaces';
import { ProductCategory } from '../Models/ProductCategory';
import { Products } from '../TestData/Products';
import usersData from '../TestData/Users.json';

const users: Users = usersData;

test.describe('User Story 1: View Product Details', () => {

    test.describe('Selecting a product from a category shows its full details', () => {
        const category = ProductCategory.POWER_TOOLS;
        const productName = Products.CORDLESS_DRILL_20V;

        test('ViewProductDetails_asLoggedInUser_showsNameDescriptionPriceImageAndEnabledAddToCart', { tag: '@story-1-view-product-details' }, async ({ page }) => {
            const productDetailsPage = new ProductDetailsPage(page);

            await test.step('Given Bob is logged in', async () => {
                await login(page, users.customer3.email, users.customer3.password);
            });

            await test.step(`When he selects ${category} > ${productName}`, async () => {
                await browseToProduct(page, category, productName);
            });

            await test.step('Then the product details page is shown with name, description, price and image', async () => {
                await expect(page).toHaveURL(/\/product\//);
                await expect(productDetailsPage.productName).toHaveText(productName);
                await expect(productDetailsPage.productDescription).not.toBeEmpty();
                await expect(productDetailsPage.unitPrice).toHaveText(/\d+\.\d{2}/);
                await expect(productDetailsPage.productImage(productName)).toBeVisible();
            });

            await test.step('And the Add to Cart button is visible and enabled', async () => {
                await expect(productDetailsPage.addToCartButton).toBeVisible();
                await expect(productDetailsPage.addToCartButton).toBeEnabled();
            });
        });
    });

    test.describe('The product details page matches the underlying API data', () => {
        const category = ProductCategory.POWER_TOOLS;
        const productName = Products.CORDLESS_DRILL_20V;

        test('ViewProductDetails_nameDescriptionAndPrice_matchTheProductsApiResponse', { tag: ['@story-1-view-product-details', '@api'] }, async ({ page, request }) => {
            const productDetailsPage = new ProductDetailsPage(page);
            const productsApi = new ProductsApi(request);
            let productId: string;
            let apiProduct: { name: string; description: string; price: number };

            await test.step('Given Bob is viewing the product details page', async () => {
                await login(page, users.customer3.email, users.customer3.password);
                await browseToProduct(page, category, productName);
                productId = new URL(page.url()).pathname.split('/').pop() ?? '';
            });

            await test.step('When the same product is fetched directly from the API', async () => {
                const response = await productsApi.getById(productId);
                expect(response.status()).toBe(HttpStatus.OK);
                apiProduct = await response.json();
            });

            await test.step("Then the UI shows the API's name, description and price", async () => {
                await expect(productDetailsPage.productName).toHaveText(apiProduct.name);
                await expect(productDetailsPage.productDescription).toHaveText(apiProduct.description);
                await expect(productDetailsPage.unitPrice).toHaveText(new RegExp(apiProduct.price.toFixed(2).replace('.', '\\.')));
            });
        });
    });

});
