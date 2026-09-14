import { test, expect } from '@playwright/test';
import { login } from '../steps/loginScreen';
import { purchaseProduct } from '../steps/purchase';
import { browseToProduct } from '../steps/productBrowsing';
import { ProductDetailsPage } from '../POM/ProductDetailsPage';
import { CheckoutPage } from '../POM/CheckoutPage';
import { InvoicesPage } from '../POM/InvoicesPage';
import { InvoiceDetailsPage } from '../POM/InvoiceDetailsPage';
import { AuthApi } from '../Api/AuthApi';
import { InvoicesApi } from '../Api/InvoicesApi';
import { HttpStatus } from '../Models/HttpStatus';
import { ProductCategory } from '../Models/ProductCategory';
import { Users } from '../Models/UserInterfaces';
import { Products } from '../TestData/Products';
import usersData from '../TestData/Users.json';

const users: Users = usersData;

test.describe('User Story 2: View Invoice After Purchase', () => {
    // Two tests here purchase as the same shared customer2 account; run
    // concurrently, the site has been observed to hand out the same invoice
    // number to two different invoices (see docs/BUGS.md), which breaks the
    // by-number row lookup in InvoicesPage. 'default' mode forces in-order,
    // same-worker execution (overriding the project's fullyParallel setting)
    // without serial mode's skip-the-rest-on-failure behavior — these tests
    // don't depend on each other's outcome, only on not racing each other.
    test.describe.configure({ mode: 'default' });

    const billingAddress = { postalCode: '60306', houseNumber: '12' };
    const paymentMethod = 'Cash on Delivery';

    test.describe('Completing a purchase clears the cart and produces a correct invoice', () => {
        const category = ProductCategory.HAND_TOOLS;
        const productName = Products.COMBINATION_PLIERS;

        test('PurchaseProduct_completesCheckout_showsInvoiceNumberAndClearsCart', { tag: '@story-2-view-invoice-after-purchase' }, async ({ page }) => {
            let invoiceNumber: string;

            await test.step('Given Jack is logged in', async () => {
                await login(page, users.customer2.email, users.customer2.password);
            });

            await test.step(`When he purchases ${productName} paying by ${paymentMethod}`, async () => {
                invoiceNumber = await purchaseProduct(page, category, productName, billingAddress, paymentMethod);
            });

            await test.step('Then an invoice number is shown for the completed order', async () => {
                expect(invoiceNumber).toMatch(/^INV-\d+$/);
            });

            await test.step('And the cart is cleared', async () => {
                await expect(page.getByTestId('nav-cart')).not.toBeVisible();
            });

            await test.step("And the invoice's details are correct", async () => {
                const invoicesPage = new InvoicesPage(page);
                const invoiceDetailsPage = new InvoiceDetailsPage(page);

                await invoicesPage.goto();
                await invoicesPage.openInvoice(invoiceNumber);

                await expect(invoiceDetailsPage.invoiceNumber).toHaveValue(invoiceNumber);
                await expect(invoiceDetailsPage.paymentMethod).toHaveValue(paymentMethod);
                await expect(invoiceDetailsPage.postalCode).toHaveValue(billingAddress.postalCode);
                // street/city/state come from this site's own address-lookup
                // simulation (randomly generated, not something the test
                // controls), so only presence is asserted, not exact values.
                await expect(invoiceDetailsPage.street).not.toHaveValue('');
                await expect(invoiceDetailsPage.city).not.toHaveValue('');
                await expect(invoiceDetailsPage.state).not.toHaveValue('');
            });
        });
    });

    test.describe('The invoice details page matches the underlying API data', () => {
        const category = ProductCategory.HAND_TOOLS;
        const productName = Products.COMBINATION_PLIERS;

        test('ViewInvoiceDetails_totalAndPaymentMethod_matchTheInvoicesApiResponse', { tag: ['@story-2-view-invoice-after-purchase', '@api'] }, async ({ page, request }) => {
            const invoicesPage = new InvoicesPage(page);
            const invoiceDetailsPage = new InvoiceDetailsPage(page);
            const authApi = new AuthApi(request);
            const invoicesApi = new InvoicesApi(request);
            let invoiceNumber: string;
            let invoiceId: string;
            let apiInvoice: { invoice_number: string; total: number; billing_postal_code: string; payment: { payment_method: string } };

            await test.step('Given Jack purchases a product and opens its invoice details page', async () => {
                await login(page, users.customer2.email, users.customer2.password);
                invoiceNumber = await purchaseProduct(page, category, productName, billingAddress, paymentMethod);
                await invoicesPage.goto();
                await invoicesPage.openInvoice(invoiceNumber);
                invoiceId = new URL(page.url()).pathname.split('/').pop() ?? '';
            });

            await test.step('When the same invoice is fetched directly from the API', async () => {
                const token = await authApi.loginAndGetToken(users.customer2.email, users.customer2.password);
                const response = await invoicesApi.getById(invoiceId, token);
                expect(response.status()).toBe(HttpStatus.OK);
                apiInvoice = await response.json();
            });

            await test.step("Then the UI shows the API's total, postal code and payment method", async () => {
                expect(apiInvoice.invoice_number).toBe(invoiceNumber);
                await expect(invoiceDetailsPage.total).toHaveValue(new RegExp(apiInvoice.total.toFixed(2).replace('.', '\\.')));
                await expect(invoiceDetailsPage.postalCode).toHaveValue(apiInvoice.billing_postal_code);
                // The API returns a slug (e.g. "cash-on-delivery"); the UI shows
                // the display label — both are checked against what was chosen.
                expect(apiInvoice.payment.payment_method).toBe('cash-on-delivery');
                await expect(invoiceDetailsPage.paymentMethod).toHaveValue(paymentMethod);
            });
        });
    });

    test.describe('Edge case: an incomplete billing address blocks checkout', () => {
        const category = ProductCategory.HAND_TOOLS;
        const productName = Products.PLIERS;

        test('IncompleteBillingAddress_keepsProceedToPaymentDisabled', { tag: '@story-2-view-invoice-after-purchase' }, async ({ page }) => {
            const checkoutPage = new CheckoutPage(page);

            await test.step('Given Jack is logged in with a product in his cart', async () => {
                await login(page, users.customer2.email, users.customer2.password);
                await browseToProduct(page, category, productName);
                await new ProductDetailsPage(page).addToCartButton.click();
            });

            await test.step('When he reaches billing address without filling it in', async () => {
                await checkoutPage.open();
                await checkoutPage.proceedFromCartButton.click();
                await checkoutPage.proceedFromSignInButton.click();
            });

            await test.step('Then proceeding to payment is blocked', async () => {
                await expect(checkoutPage.proceedFromBillingButton).toBeDisabled();
            });
        });
    });

});