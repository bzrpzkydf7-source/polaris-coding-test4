import { Page, expect } from '@playwright/test';
import { browseToProduct } from './productBrowsing';
import { ProductDetailsPage } from '../POM/ProductDetailsPage';
import { CheckoutPage } from '../POM/CheckoutPage';
import { ProductCategory } from '../Models/ProductCategory';

interface BillingAddress {
    postalCode: string;
    houseNumber: string;
}

// Returns the invoice number shown on the order confirmation.
export async function purchaseProduct(
    page: Page,
    category: ProductCategory,
    productName: string,
    billingAddress: BillingAddress,
    paymentMethod: string,
): Promise<string> {
    await browseToProduct(page, category, productName);
    const productDetailsPage = new ProductDetailsPage(page);
    await productDetailsPage.addToCartButton.click();

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.open();
    await checkoutPage.proceedFromCartButton.click();
    await checkoutPage.proceedFromSignInButton.click();
    await checkoutPage.fillBillingAddress(billingAddress.postalCode, billingAddress.houseNumber);
    await checkoutPage.proceedFromBillingButton.click();
    await checkoutPage.selectPaymentMethod(paymentMethod);
    await checkoutPage.submitPayment();
    // The same button drives both stages; clicking it again before this
    // first stage's "Payment was successful" message has actually rendered
    // fires the second click too early for it to register.
    await expect(checkoutPage.paymentSuccessMessage).toBeVisible();
    await checkoutPage.confirmOrder();

    const confirmationText = await checkoutPage.orderConfirmationMessage.textContent();
    const invoiceNumberMatch = confirmationText?.match(/INV-\d+/);
    if (!invoiceNumberMatch) {
        throw new Error(`Could not find an invoice number in the order confirmation: "${confirmationText}"`);
    }
    return invoiceNumberMatch[0];
}