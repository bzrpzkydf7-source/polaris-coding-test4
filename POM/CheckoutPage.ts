import { Page, Locator, expect } from '@playwright/test';

export class CheckoutPage {
    readonly page: Page;
    readonly cartNavLink: Locator;
    readonly cartTotal: Locator;
    readonly proceedFromCartButton: Locator;
    readonly proceedFromSignInButton: Locator;
    readonly postalCodeInput: Locator;
    readonly houseNumberInput: Locator;
    readonly streetInput: Locator;
    readonly proceedFromBillingButton: Locator;
    readonly paymentMethodSelect: Locator;
    // Same button drives two stages of the payment step: the first click
    // submits the chosen payment method (shows a "Payment was successful"
    // message), the second finalises the order and creates the invoice.
    readonly paymentActionButton: Locator;
    readonly paymentSuccessMessage: Locator;
    readonly orderConfirmationMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        this.cartNavLink = page.getByTestId('nav-cart');
        this.cartTotal = page.getByTestId('cart-total');
        this.proceedFromCartButton = page.getByTestId('proceed-1');
        this.proceedFromSignInButton = page.getByTestId('proceed-2');
        this.postalCodeInput = page.getByTestId('postal_code');
        this.houseNumberInput = page.getByTestId('house_number');
        this.streetInput = page.getByTestId('street');
        this.proceedFromBillingButton = page.getByTestId('proceed-3');
        this.paymentMethodSelect = page.getByTestId('payment-method');
        this.paymentActionButton = page.getByTestId('finish');
        this.paymentSuccessMessage = page.getByText(/payment was successful/i);
        this.orderConfirmationMessage = page.getByText(/thanks for your order/i);
    }

    // The "Sign in" step greets an already-authenticated user by name with no
    // data-test hook, so this is matched by text, like the payment/order
    // confirmation messages above.
    signInGreeting(firstName: string, lastName: string): Locator {
        return this.page.getByText(new RegExp(`Hello ${firstName} ${lastName}, you are already logged in`));
    }

    async open() {
        // A hard page.goto('/checkout') has been observed to intermittently
        // fail to render the cart (the Angular cart component errors out on
        // a cold load). Clicking the in-app cart nav link — a client-side
        // route change into an already-bootstrapped app — is reliable.
        await this.cartNavLink.click();
    }

    async fillBillingAddress(postalCode: string, houseNumber: string) {
        await this.postalCodeInput.fill(postalCode);
        await this.houseNumberInput.fill(houseNumber);
        // Entering a postal code + house number triggers this site's address
        // lookup, which asynchronously fills street/city/state; wait for that
        // before proceeding so the "Proceed to checkout" validity check (and
        // any caller reading these fields back) sees the settled values.
        await expect(this.streetInput).not.toHaveValue('');
    }

    async selectPaymentMethod(method: string) {
        await this.paymentMethodSelect.selectOption(method);
    }

    async submitPayment() {
        await this.paymentActionButton.click();
    }

    async confirmOrder() {
        await this.paymentActionButton.click();
    }
}