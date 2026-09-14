import { test, expect } from '@playwright/test';
import { AuthApi } from '../../Api/AuthApi';
import { InvoicesApi } from '../../Api/InvoicesApi';
import { HttpStatus } from '../../Models/HttpStatus';
import { Users } from '../../Models/UserInterfaces';
import usersData from '../../TestData/Users.json';

const users: Users = usersData;

test.describe('API: Invoices', () => {

    test('ListInvoices_withoutToken_returns401Unauthorized', { tag: ['@api', '@story-2-view-invoice-after-purchase'] }, async ({ request }) => {
        const invoicesApi = new InvoicesApi(request);

        const response = await invoicesApi.list();

        expect(response.status()).toBe(HttpStatus.UNAUTHORIZED);
    });

    test('ListInvoices_withValidToken_returnsThisUsersInvoices', { tag: ['@api', '@story-2-view-invoice-after-purchase'] }, async ({ request }) => {
        const authApi = new AuthApi(request);
        const invoicesApi = new InvoicesApi(request);
        const token = await authApi.loginAndGetToken(users.customer2.email, users.customer2.password);

        const response = await invoicesApi.list(token);

        expect(response.status()).toBe(HttpStatus.OK);
        const body = await response.json();
        expect(Array.isArray(body.data)).toBe(true);
        expect(body.data.length).toBeGreaterThan(0);
        // Every invoice must belong to the account whose token requested them.
        for (const invoice of body.data) {
            expect(invoice).toHaveProperty('invoice_number');
            expect(invoice).toHaveProperty('total');
        }
    });

    test('GetInvoiceById_forAnOwnedInvoice_returnsItsFullDetails', { tag: ['@api', '@story-2-view-invoice-after-purchase'] }, async ({ request }) => {
        const authApi = new AuthApi(request);
        const invoicesApi = new InvoicesApi(request);
        const token = await authApi.loginAndGetToken(users.customer2.email, users.customer2.password);
        const listResponse = await invoicesApi.list(token);
        const { data } = await listResponse.json();
        const knownInvoice = data[0];

        const response = await invoicesApi.getById(knownInvoice.id, token);

        expect(response.status()).toBe(HttpStatus.OK);
        const body = await response.json();
        expect(body.invoice_number).toBe(knownInvoice.invoice_number);
        expect(body.total).toBe(knownInvoice.total);
        expect(body).toHaveProperty('billing_street');
        expect(body).toHaveProperty('payment');
        expect(Array.isArray(body.invoicelines)).toBe(true);
        expect(body.invoicelines.length).toBeGreaterThan(0);
    });

});
